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
  static onLogAsserts;
  static compareAttempts = (a, b) => a.time - b.time || a.mem - b.mem;

  constructor(name, data) {
    this.name = name;
    Object.entries(data).forEach(([k, v]) => (this[k] = v));
    this.src ??= name;
  }

  bestStat = async (cmd, input, expectedOut) => {
    let best;
    if (input)
      if (cmd.includes("<input>")) cmd = cmd.replaceAll("<input>", input);
      else cmd += " " + input;

    for (let i = 0; i < Test.attempts; ++i) {
      let beforePid;

      if (this.before) beforePid = Cmd.spawn(...fromStr(this.before));
      const { stdout, stat, code, stderr } = await Cmd.stat(
        ...fromStr(cmd),
        "tmp",
      );

      if (beforePid) process.kill(log("d", "kill", beforePid), "SIGKILL");
      this.logAttempt(input, stat, i);
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
    }

    return best;
  };

  bench = async (cmd) => {
    const stats = {};

    if (this.asserts && Object.keys(this.asserts).length) {
      const assertsKeys = Object.keys(this.asserts);
      for (let i = 0; i < assertsKeys.length; ++i) {
        const input = assertsKeys[i].replaceAll("<threads>", Test.maxThreads);

        if (Test.onLogAsserts)
          log("s", msgs.currentAssert(i, assertsKeys.length, input));

        stats[input] = await this.bestStat(cmd, input, this.asserts[input]);
      }
    } else stats[""] = await this.bestStat(cmd, null, null);
    return stats;
  };

  benchLangs = async (langs, logCb) => {
    const lBenchEntries = [];
    const appName = this.src;
    for (let j = 0; j < langs.length; ++j) {
      const lang = langs[j];
      this.logAttempt = (input, stat, attemptI) =>
        log(
          "a",
          msgs.tests.currentAttempt(
            this.name,
            Test.attempts,
            lang.name,
            input,
            stat,
            attemptI,
          ),
        );
      let buildStat;
      if (lang.build) buildStat = await lang.buildStat(appName);

      const threads =
        this.multiThreads && Test.maxThreads >= 2 ? Test.maxThreads : 1;
      const cmdRun =
        "taskset -c 0-" +
        (threads - 1) +
        " " +
        lang.getRunCmd(appName).replaceAll("<threads-count>", threads);

      logCb(this.name, lang.name, j);
      log("d", "tmp folder", fs.readdirSync("./tmp"));
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
