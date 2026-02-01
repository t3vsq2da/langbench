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
  static compareAttempts = (a, b) => a.time - b.time || a.mem - b.mem;

  constructor(name, data) {
    this.name = name;
    Object.entries(data).forEach(([k, v]) => (this[k] = v));
  }

  bestStat = async (cmd, input, expectedOut, langN) => {
    let best;
    cmd += " " + input;
    for (let i = 0; i < Test.attempts; ++i) {
      const { stdout, stat, code, stderr } = await Cmd.stat(
        ...fromStr(cmd),
        "tmp"
      );
      log(
        "a",
        `${this.name}[${input}] {${langN}} attempt ${i + 1}/${
          Test.attempts
        } : ` + msgs.benchEntires(stat)
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

  bench = async (cmd, langN) => {
    const stats = {};

    if (this.asserts && Object.keys(this.asserts).length) {
      for (const input in this.asserts) {
        stats[input] = await this.bestStat(
          cmd,
          input,
          this.asserts[input],
          langN
        );
      }
    } else {
      stats[""] = await this.bestStat(cmd, null, null, langN);
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

      if (this.multiThreads && Test.maxThreads >= 2) {
        cmdRun = cmdRun.replaceAll("<threads-count>", "" + Test.maxThreads);
        cmdRun = "taskset -c 0-" + (Test.maxThreads - 1) + " " + cmdRun + "";
      } else {
        cmdRun = cmdRun.replaceAll("<threads-count>", "1");
        cmdRun = "taskset -c 0 " + cmdRun + " ";
      }

      log(
        "s",
        `[test ${testIndex + 1}/${testLen} | lang ${j + 1}/${langs.length}] "${
          this.name
        }" (${lang.name})`
      );
      const benchResult = await this.bench(cmdRun, lang.name);
      lBenchEntries.push(
        ...Entries.parseBecnhResult(
          benchResult,
          this.name,
          lang.name,
          buildStat
        )
      );

      fs.rmSync(lang.out ?? appName, { force: true });
    }
    return lBenchEntries;
  };
}
