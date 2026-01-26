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

  static getEnabled = (rawLangs, names) => {
    excludeDisabled(rawLangs);

    let entries = Object.entries(rawLangs);

    if (names[0] !== ALL) {
      const undefinedLang = names.find(tName => !(tName in names));
      if (undefinedLang != null)
        throw new LBError(msgs.undefinedLang(undefinedLang));
      else entries = entries.filter(([name]) => names.includes(name));
    }

    return log(
      "d",
      "langs",
      entries.map(([name, data]) => new Lang(name, data))
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

  buildStat = async tName => {
    const src = this.findSrc(tName);

    if (this.build) {
      pwd.toTmp();
      const [cmd, ...args] = splitCmd(
        this.build
          .replace("<src>", path.join("../", src))
          .replace("<out>", tName)
      );

      const {
        stat: { time },
      } = await statCmd(cmd, args);
      const size = fs.statSync(this.out ?? tName).size;

      return { time, size };
    }
  };
}
