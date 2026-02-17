import { fromStr } from "./cmd.mjs";
import {
  excludeDisabled,
  msgs,
  LBError,
  show,
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
    this.src ??= name;
  }

  bestStat = async (cmd, input, expectedOut) => {
    let before = this.before;
    let beforeInput, runInput;
    if (input) {
      const idx = input?.indexOf("||");
      if (idx === -1) {
        runInput = input;
      } else {
        beforeInput = input.slice(0, idx);
        runInput = input.slice(idx + 2);
      }
      if (cmd.includes("<input>")) cmd = cmd.replaceAll("<input>", runInput);
      else cmd += " " + runInput;

      before = before?.replaceAll("<input>", beforeInput ?? "");
    }

    let best;
    for (let i = 0; i < Test.attempts; ++i) {
      let beforePid;
      let caseRes;

      try {
        if (before) {
          const pidRef = {};
          Cmd.exec(...fromStr(before), null, pidRef);
          beforePid = pidRef.pid;
        }

        caseRes = await Cmd.stat(...fromStr(cmd), "tmp");
      } finally {
        if (beforePid) process.kill(beforePid, "SIGKILL");
      }

      const { stdout, stat, code, stderr } = caseRes;

      show("as", msgs.tests.currentAttempt(i, Test.attempts, stat));
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
            stderr,
          ),
        );

      if (best == null || Test.compareAttempts(stat, best) == -1) best = stat;

      //pause
      await new Promise((r) => setTimeout(r, 44));
    }

    return best;
  };

  bench = async (cmd) => {
    const stats = {};

    if (this.cases && Object.keys(this.cases).length) {
      const casesKeys = Object.keys(this.cases);
      for (let i = 0; i < casesKeys.length; ++i) {
        const input = casesKeys[i].replaceAll("<threads>", Test.maxThreads);

        show("cs", msgs.tests.currentCase(i, casesKeys.length, input));

        stats[input] = await this.bestStat(cmd, input, this.cases[input]);
      }
    } else stats[""] = await this.bestStat(cmd);
    return stats;
  };

  benchLangs = async (langs) => {
    const lBenchEntries = [];
    const appName = this.src;
    for (let j = 0; j < langs.length; ++j) {
      const lang = langs[j];
      show("s", msgs.tests.currentLang(j, langs.length, lang.name));

      let buildStat;
      if (lang.build) buildStat = await lang.buildStat(appName);

      const threads =
        this.multiThreads && Test.maxThreads >= 2 ? Test.maxThreads : 1;
      const cmdRun =
        "taskset -c 0-" +
        (threads - 1) +
        " " +
        lang.getRunCmd(appName).replaceAll("<threads-count>", threads);

      const benchResult = await this.bench(cmdRun);

      lBenchEntries.push(
        ...Entries.parseBecnhResult(
          benchResult,
          this.name,
          lang.name,
          buildStat,
        ),
      );

      fs.rmSync(lang.out ?? appName, { force: true });
    }
    return lBenchEntries;
  };
}
