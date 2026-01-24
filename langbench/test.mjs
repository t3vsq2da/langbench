import { exec, log } from "./utils.mjs";

export default class Test {
  constructor(name, data) {
    this.name = name;
    Object.entries(data).forEach(([k, v]) => (this[k] = v));
  }
  run(cmd) {
    // в tmp директории!
    log("c", cmd);
  }
}

export class TestMeasure {}
