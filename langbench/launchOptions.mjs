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
  Cmd,
} from "./utils.mjs";

import fs from "fs";
import os from "os";

class LaunchOptions {
  constructor(vargs) {
    if (vargs.includes("--help") || vargs.includes("-help")) {
      console.log(helpMsg);
      return {};
    }
    const options = { ...LaunchOptions.default };
    for (let i = 2; i < vargs.length; )
      if (vargs[i].startsWith("-")) {
        const flag = vargs[i].slice(1);
        if (!(flag in LaunchOptions.checks) || !flag.length)
          throw new LBError(msgs.launchOptions.undefinedFlag(flag));

        let values = [];
        while (vargs[++i] != null && !vargs[i].startsWith("-"))
          values.push(vargs[i]);

        if (Array.isArray(options[flag]) && Array.isArray(values))
          values = values.map(autoCast);
        else if (
          (!Array.isArray(options[flag]) && values.length == 0) ||
          values.length == 1
        )
          values = autoCast(values[0] ?? true);
        else throw new LBError(msgs.launchOptions.validArgFail(flag, values));

        if (!LaunchOptions.checks[flag](values))
          throw new LBError(msgs.launchOptions.validArgFail(flag, values));
        else options[flag] = values;
      } else throw new LBError(msgs.launchOptions.noFlag());
    return { ...this, ...options };
  }

  static sysInfo = async () => {
    const cpu = () => {
      const content = fs.readFileSync("/proc/cpuinfo", "utf8");
      const lines = content.split("\n");

      let logicalCount = 0;
      let modelName = "";

      for (const line of lines)
        if (line.startsWith("processor")) logicalCount++;
        else if (line.startsWith("model name") && !modelName)
          modelName = line.split(":")[1].trim();

      return {
        model: modelName,
        logicalCores: logicalCount,
      };
    };

    const disks = async () => {
      const { stdout } = await Cmd.exec("lsblk", [
        "-d",
        "-o",
        "NAME,MODEL,SERIAL,SIZE,TRAN",
        "--json",
      ]);
      const devs = JSON.parse(stdout).blockdevices;
      return devs
        .filter(dev => {
          if (dev.model == null || dev.name == null || dev.serial == null)
            return 0;
          else if (/^(loop|ram|zram|dm-|md|sr|fd)/.test(dev.name)) return 0;
          else if (fs.readFileSync(`/sys/block/${dev.name}/removable`) == 1)
            return 0;
          else return 1;
        })
        .map(dev => dev.model);
    };

    const oss = () => {
      return {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
      };
    };

    return { cpu: cpu(), disks: await disks(), os: oss() };
  };

  static checks = {
    //log stages
    ls: isType("boolean"),
    //log debug
    //i deleted most of the debug messages. :)
    ld: isType("boolean"),
    //log cmds
    lc: isType("boolean"),
    //log attempts
    la: isType("boolean"),
    //log individual tests | выводит результаты каждого теста
    li: v => [0, 1, 2].includes(v),
    //log hardware(with os)
    lh: isType("boolean"),
    //tests
    t: pipe(
      map(v => v.toString().trim()),
      every(isSet, pipe(isEmpty, opposite))
    ),
    //langs
    l: pipe(
      map(v => v.toString().trim()),
      every(isSet, pipe(isEmpty, opposite))
    ),
    //attemps count
    ac: every(isType("number"), Number.isInteger, n => n > 0),
    //fast mode
    fm: isType("boolean"),
    //save result json
    srj: isType("boolean"),
    //save result table
    srt: isType("boolean"),
    //max count threads for multithrteads tests
    mt: every(isType("number"), Number.isInteger, n => n >= 1),
  };

  static default = {
    ls: true,
    ld: false,
    lc: false,
    la: false,
    li: 1,
    lh: true,
    t: [ALL],
    l: [ALL],
    d: false,
    ac: 5,
    fm: false,
    srj: false,
    srt: true,
    mt: null,
  };
}

export default LaunchOptions;

const helpMsg = ``;
