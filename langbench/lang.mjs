import { LBError, statCmd, msgs, log, pwd, exec, splitCmd } from "./utils.mjs";
import path from "node:path";

import fs from "node:fs";

export default class Lang {
  constructor(name, data) {
    this.name = name;
    Object.entries(data).forEach(([k, v]) => (this[k] = v));
  }

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
