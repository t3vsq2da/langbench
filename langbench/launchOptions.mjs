import {
  pipe,
  msgs,
  isSet,
  ALL,
  every,
  autoCast,
  isType,
  isEmpty,
  LBError,
  map,
  opposite,
  excludeDisabled,
  Cmd,
  isArray,
} from "./utils.mjs";

import fs from "node:fs";
import { default as nodeOS } from "node:os";

class LaunchOptions {
  constructor(vargs) {
    if (vargs.includes("--help") || vargs.includes("-help")) {
      console.log(helpMsg);
      return {};
    }

    const rawOptions = { ...LaunchOptions.default };
    for (let i = 2; i < vargs.length; )
      if (vargs[i].startsWith("-")) {
        const flag = vargs[i].slice(1);

        if (!flag.length)
          throw new LBError(msgs.launchOptions.undefinedFlag(flag));

        let values = [];
        while (vargs[++i] != null && !vargs[i].startsWith("-"))
          values.push(vargs[i]);

        if (isArray(rawOptions[flag]) && isArray(values))
          values = values.map(autoCast);
        else if (
          (!isArray(rawOptions[flag]) && values.length == 0) ||
          values.length == 1
        )
          values = autoCast(values[0] ?? true);
        else throw new LBError(msgs.launchOptions.validArgFail(flag, values));

        rawOptions[flag] = values;
      } else throw new LBError(msgs.launchOptions.noFlag());
    this.rawOptions = rawOptions;
  }

  init = async () => {
    await this.loadSysInfo();
    if (this.rawOptions.mt == null)
      this.rawOptions.mt = Math.max(1, this.sysInfo.cpu.threads / 2);
    this.validation();
    for (const flag in this.rawOptions) this[flag] = this.rawOptions[flag];
    delete this.rawOptions;
    this.loadConfigs();
    await this.checkRequires();
  };

  toString = () => `attempt-count:${this.ac} max-threads:${this.mt} mode:${
    this.m
  }
langs:${Object.keys(this.langs)
    .map(k => "'" + k + "'")
    .join(", ")}
tests:${Object.keys(this.tests)
    .map(k => "'" + k + "'")
    .join(", ")}
logging:${this.ls ? " stages" : ""}${this.la ? " attempts" : ""}${
    this.li == 1
      ? " result-of-each-test"
      : this.li == 2
      ? " result-of-each-assert"
      : ""
  }${this.lc ? " commands" : ""}${this.ld ? " debug" : ""}
save results:${this.srt ? " tables" : ""}${this.srj ? " json" : ""}
  `;

  checkRequires = async () => {
    let rMsgs = [];
    const checkReq = async (name, req) => {
      if ((await Cmd.exec("which", req)).code)
        rMsgs.push(msgs.launchOptions.needReq(name, req));
    };

    if ((await Cmd.exec("ls", "/usr/bin/time")).code)
      rMsgs.push(msgs.launchOptions.needReq("LangBench", "GNU time"));

    await checkReq("LangBench", "taskset");

    for (let [lName, lang] of Object.entries(this.langs)) {
      if (lang.req)
        if (lang.req.length)
          for (let req of lang.req) await checkReq(lName, req);
        else await checkReq(lName, lang.req);
    }
    if (rMsgs.length) throw new LBError(rMsgs.join("\n"));
  };

  validation = () => {
    const checks = {
      t: pipe(
        //tests
        map(v => v.toString().trim()),
        every(isSet, pipe(isEmpty, opposite))
      ),
      l: pipe(
        //langs
        map(v => v.toString().trim()),
        every(isSet, pipe(isEmpty, opposite))
      ),
      ac: every(isType("number"), Number.isInteger, n => n > 0), //attemps count
      m: every(isType("string"), m =>
        ["fast", "normal", "detailed"].includes(m)
      ), //mode
      mt: every(
        isType("number"),
        Number.isInteger,
        n => n >= 1 && n < this.sysInfo.cpu.threads
      ), //max count threads for multithrteads tests
      ls: v => [0, 1, 2].includes(v), //log stages
      ld: isType("boolean"), //log debug
      lc: isType("boolean"), //log cmds
      la: isType("boolean"), //log attempts
      li: v => [0, 1, 2].includes(v), //log individual tests
      llo: isType("boolean"), //log launchOptions
      srj: isType("boolean"), //save result json
      srt: isType("boolean"), //save result table
    };
    const raw = this.rawOptions;
    for (let flag in raw)
      if (!(flag in checks))
        throw new LBError(msgs.launchOptions.undefinedFlag(flag));
      else if (!checks[flag](raw[flag]))
        throw new LBError(msgs.launchOptions.validArgFail(flag, raw[flag]));
  };

  loadConfigs = () => {
    this.tests = this.getDataConfig("tests.json", this.t);
    this.langs = this.getDataConfig("langs.json", this.l);
  };

  getDataConfig = (fileName, enabled) => {
    let raw = JSON.parse(fs.readFileSync(fileName).toString());
    raw = excludeDisabled(raw, this.m);
    if (enabled[0] == ALL) return raw;
    else {
      const undefinedName = enabled.find(name => !(name in raw));
      if (undefinedName != null)
        throw new LBError(
          msgs.launchOptions.undefinedName(fileName, undefinedName)
        );
      else
        return Object.fromEntries(
          Object.entries(raw).filter(([name]) => enabled.includes(name))
        );
    }
  };

  loadSysInfo = async () => {
    const cpu = () => {
      const lines = fs.readFileSync("/proc/cpuinfo").toString().split("\n");
      let logicalCores = 0,
        model = "";
      for (const line of lines) {
        if (line.startsWith("processor")) logicalCores++;
        else if (!model && line.startsWith("model name"))
          model = line.split(":")[1].trim();
      }
      return { model, threads: logicalCores };
    };

    const disks = async () => {
      const { stdout } = await Cmd.exec(
        "lsblk",
        ["-d", "-o", "NAME,MODEL,SERIAL,SIZE,TRAN", "--json"],
        "root",
        1
      );
      return (
        JSON.parse(stdout)
          //discarding removable media and non-real disks
          .blockdevices.filter(
            d =>
              d.model &&
              d.name &&
              d.serial &&
              !/^(loop|ram|zram|dm-|md|sr|fd)/.test(d.name) &&
              fs.readFileSync(`/sys/block/${d.name}/removable`, "utf8") !== "1"
          )
          .map(d => d.model)
      );
    };

    const os = () => {
      return {
        platform: nodeOS.platform(),
        release: nodeOS.release(),
        arch: nodeOS.arch(),
      };
    };

    this.sysInfo = { cpu: cpu(), disks: await disks(), os: os() };
  };

  static default = {
    m: "normal",
    t: [ALL],
    l: [ALL],
    ac: 1, //there is almost no difference between attempts, both on isolated cores and on other cores.
    mt: null,
    ls: 1,
    ld: false,
    lc: false,
    la: false,
    li: 1,
    llo: true,
    srj: false,
    srt: true,
  };
}

export default LaunchOptions;

const helpMsg = `help`;
