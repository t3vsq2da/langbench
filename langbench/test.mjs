import { stderr } from "node:process";
import {
  statCmd,
  excludeDisabled,
  msgs,
  log,
  pwd,
  LBError,
  splitCmd,
  ALL,
  exec,
} from "./utils.mjs";

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
        throw new LBError(msgs.undefinedTest(undefinedTest));
      else entries = entries.filter(([name]) => names.includes(name));
    }

    return entries.map(([name, data]) => new Test(name, data));
  };

  async bestStat(cmd, input, expectedOut, lName) {
    if (input) cmd += " " + input;
    cmd = splitCmd(cmd);
    let best;

    for (let i = 0; i < Test.attempts; ++i) {
      pwd.toTmp();
      const { stdout, stat, code } = await statCmd(cmd[0], cmd.slice(1));
      log(
        "a",
        `${this.name}[${input}] attempt ${i + 1}/${Test.attempts} : ` +
          msgs.formatStat.stat(stat)
      );
      if (
        expectedOut != null &&
        stdout.toString().trim() != expectedOut.toString().trim()
      )
        throw new LBError(
          msgs.incorrectRes(this.name, cmd.join(" "), code, expectedOut, stdout)
        );

      if (best == null || Test.compareAttempts(stat, best) == -1) best = stat;
    }
    return best;
  }

  async bench(cmd, lName) {
    const stats = {};

    if (this.asserts && Object.keys(this.asserts).length) {
      for (const input in this.asserts) {
        stats[input] = await this.bestStat(
          cmd,
          input,
          this.asserts[input],
          lName
        );
      }
    } else {
      stats[""] = await this.bestStat(cmd, null, null, lName);
    }
    return stats;
  }
}

export class TestMeasure {}
