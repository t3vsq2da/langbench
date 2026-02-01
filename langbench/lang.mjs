import { LBError, excludeDisabled, msgs, Cmd } from "./utils.mjs";
import path from "node:path";
import fs from "node:fs";

export default class Lang {
  constructor(name, data) {
    this.name = name;
    Object.entries(data).forEach(([k, v]) => (this[k] = v));
    this.folder ??= name;
    if (this.build) {
      this.out ??= "<test-src>";
      this.run ??= "./<app>";
    } else this.run ??= name + " <app>";
  }

  findSrc = src => {
    if (!fs.existsSync(this.folder))
      throw new LBError(msgs.langs.srcNoFound(this.name, this.folder, src));

    let matches = fs.readdirSync(this.folder).filter(e => e.startsWith(src));
    if (matches.length === 0)
      throw new LBError(msgs.langs.srcNoFound(this.name, src));
    else if (this.ext != null) {
      const fullName = src + "." + this.ext;

      if (matches.find(f => f === fullName) != null)
        return path.join(this.folder, fullName);
      else throw new LBError(msgs.langs.srcNoFound(this.name, fullName));
    } else if (matches.length === 1) return path.join(this.folder, matches[0]);
    else throw new LBError(msgs.langs.specifyExt(this.name));
  };

  //relative tmp folder
  getRunCmd = appName => {
    if (this.build) return this.run.replaceAll("<app>", appName);
    else
      return this.run.replaceAll(
        "<app>",
        path.join("../", this.findSrc(appName))
      );
  };

  buildStat = async testSrc => {
    const src = this.findSrc(testSrc);
    const out = path.join("tmp", testSrc);

    const {
      stat: { time },
    } = await Cmd.stat(
      ...Cmd.fromStr(
        this.build.replaceAll("<src>", src).replaceAll("<out>", out)
      )
    );

    const size = fs.statSync(this.out.replaceAll("<test-src>", out)).size;

    return { time, size };
  };
}
