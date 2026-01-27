import {
  LBError,
  excludeDisabled,
  statCmd,
  msgs,
  log,
  pwd,
  exec,
  splitCmd,
  ALL,
} from "./utils.mjs";
import path from "node:path";
import fs from "node:fs";

export default class Lang {
  constructor(name, data) {
    this.name = name;
    Object.entries(data).forEach(([k, v]) => (this[k] = v));
  }

  static getEnabled = async (rawLangs, names, fm) => {
    excludeDisabled(rawLangs, fm);

    let entries = Object.entries(rawLangs);

    if (names[0] !== ALL) {
      const undefinedLang = names.find(tName => !(tName in rawLangs));
      if (undefinedLang != null)
        throw new LBError(msgs.undefinedLang(undefinedLang));
      else entries = entries.filter(([name]) => names.includes(name));
    }

    const checkReq = async (name, req) => {
      if ((await exec("which", req)).code)
        throw new LBError(msgs.needReq(req, name));
    };

    return await Promise.all(
      entries.map(async ([name, data]) => {
        if (data.req)
          if (data.req.length)
            for (let req of data.req) await checkReq(name, req);
          else await checkReq(name, data.req);
        return new Lang(name, data);
      })
    );
  };

  findSrc = src => {
    pwd.toRoot();

    let matches = fs.readdirSync(this.folder).filter(e => e.startsWith(src));
    if (matches.length === 0)
      throw new LBError(msgs.srcNoFound(this.name, src));
    else if (this.ext != null) {
      const fullName = src + "." + this.ext;

      if (matches.find(f => f === fullName) != null)
        return path.join(this.folder, fullName);
      else throw new LBError(msgs.srcNoFound(this.name, fullName));
    } else if (matches.length === 1) return path.join(this.folder, matches[0]);
    else throw new LBError(msgs.specifyExt(this.name));
  };

  //relative tmp folder
  getRunCmd = testSrc => {
    if (this.run)
      return this.run?.replace(
        "<src>",
        path.join("../", this.findSrc(testSrc))
      );
    else if (this.build)
      return this.run?.replace("<src>", testSrc) ?? "./" + testSrc;
    else throw new LBError(msgs.langNoRun(this.name));
  };

  buildStat = async testSrc => {
    const src = this.findSrc(testSrc);

    if (this.build) {
      pwd.toTmp();
      const [cmd, ...args] = splitCmd(
        this.build
          .replace("<src>", path.join("../", src))
          .replace("<out>", testSrc)
      );

      const {
        stat: { time },
      } = await statCmd(cmd, args);
      const size = fs.statSync(this.out ?? testSrc).size;

      return { time, size };
    }
  };
}
