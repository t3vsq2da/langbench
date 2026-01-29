import { fromStr } from "./cmd.mjs";
import {
  excludeDisabled,
  msgs,
  log,
  LBError,
  ALL,
  Cmd,
  Entries,
} from "./utils.mjs";
import fs from "fs";

export default class Test {
  static attempts;
  static compareAttempts = (a, b) => a.time - b.time;

  constructor(name, data) {
    this.name = name;
    Object.entries(data).forEach(([k, v]) => (this[k] = v));
  }

  static getEnabled = (rawTests, names, fm) => {
    excludeDisabled(rawTests, fm);

    let entries = Object.entries(rawTests);

    if (names[0] !== ALL) {
      const undefinedTest = names.find(tName => !(tName in rawTests));
      if (undefinedTest != null)
        throw new LBError(msgs.tests.undefinedTest(undefinedTest));
      else entries = entries.filter(([name]) => names.includes(name));
    }

    return entries.map(([name, data]) => {
      if (data.src == null)
        throw new LBError(msgs.tests.missedFieldTest(name, "src"));
      return new Test(name, data);
    });
  };

  bestStat = async (cmd, input, expectedOut) => {
    let best;

    for (let i = 0; i < Test.attempts; ++i) {
      const { stdout, stat, code, stderr } = await Cmd.stat(
        ...fromStr(cmd + " " + input),
        "tmp"
      );
      log(
        "a",
        `${this.name}[${input}] attempt ${i + 1}/${Test.attempts} : ` +
          msgs.benchEntires(stat)
      );
      if (
        expectedOut != null &&
        stdout.toString().trim() != expectedOut.toString().trim()
      )
        throw new LBError(
          msgs.utils.incorrectRes(
            this.name,
            cmd,
            code,
            expectedOut,
            stdout,
            stderr
          )
        );

      if (best == null || Test.compareAttempts(stat, best) == -1) best = stat;
    }
    return best;
  };

  bench = async cmd => {
    const stats = {};

    if (this.asserts && Object.keys(this.asserts).length) {
      for (const input in this.asserts) {
        stats[input] = await this.bestStat(cmd, input, this.asserts[input]);
      }
    } else {
      stats[""] = await this.bestStat(cmd, null, null);
    }
    return stats;
  };

  benchLangs = async (langs, testIndex, testLen) => {
    const lBenchEntries = [];
    const appName = this.src;
    for (let j = 0; j < langs.length; ++j) {
      const lang = langs[j];
      let buildStat;
      if (lang.build) buildStat = await lang.buildStat(appName);

      let cmdRun = lang.getRunCmd(appName);
      log(
        "s",
        `[test ${testIndex + 1}/${testLen} | lang ${j + 1}/${langs.length}] "${
          this.name
        }" (${lang.name})`
      );
      const benchResult = await this.bench(cmdRun);
      lBenchEntries.push(
        ...Entries.parseBecnhResult(benchResult, lang.name, buildStat)
      );

      fs.rmSync(lang.out ?? appName, { force: true });
    }
    return lBenchEntries;
  };
}
