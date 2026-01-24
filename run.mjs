import {
  pipe,
  _,
  pwd,
  msgs,
  isSet,
  ALL,
  partial,
  every,
  autoCast,
  typeOf,
  isType,
  inRange,
  head,
  isEmpty,
  LBError,
  setLog,
  log,
  exec,
  statCmd,
} from "./langbench/utils.mjs";
import LaunchOptions from "./langbench/launchOptions.mjs";
import fs, { readdirSync } from "node:fs";
import path from "node:path";
import Test from "./langbench/test.mjs";
import Lang from "./langbench/lang.mjs";

const tests = { t1: 1, t2: 2 };
const langs = { l1: 1, l2: 2 };

const launchOptions = new LaunchOptions(process.argv);

setLog((head, ...tail) => {
  if (isEmpty(tail)) {
    console.log(head);
    return head;
  } else if (launchOptions["l" + head]) {
    const prefix = log.prefixs[head];
    if (prefix) console.log(prefix, ...tail);
    else console.log(tail);
  }
  return tail.at(-1);
});

log.prefixs = {
  w: "[!]", //warn
  i: "", //individual
  s: "[#]", //stage
  c: "[$]", //command
  a: "[~]", //attempt
  d: "[@]", //debug
};

async function main() {
  const rawTests = JSON.parse(fs.readFileSync("./tests.json"));
  const rawLangs = JSON.parse(fs.readFileSync("./langs.json"));

  log("s", "parse configs");
  [rawTests, rawLangs].forEach(function exclude(obj) {
    for (let key in obj) {
      if (key.startsWith("--")) {
        delete obj[key];
        continue;
      } else if (key.startsWith("++"))
        if (launchOptions.fm) {
          delete obj[key];
          continue;
        } else {
          obj[key.slice(2)] = obj[key];
          delete obj[key];
          key = key.slice(2);
        }

      if (isType("object")(obj[key])) obj[key] = exclude(obj[key]);
    }
    return obj;
  });

  if (launchOptions.l[0] === ALL) launchOptions.l = Object.keys(rawLangs);
  else if (launchOptions.l.some(lName => !(lName in rawLangs)))
    throw new LBError(msgs.validArgFail("-l", launchOptions.l));

  if (launchOptions.t[0] === ALL) launchOptions.t = Object.keys(rawTests);
  else if (launchOptions.t.some(tName => !(tName in rawTests)))
    throw new LBError(msgs.validArgFail("-t", launchOptions.t));

  log("s", "init tests&langs");
  const tests = log(
    "d",
    "processed tests",
    Object.entries(rawTests)
      .filter(([t]) => launchOptions.t.includes(t))
      .map(e => new Test(...e))
  );
  const langs = log(
    "d",
    "processed langs",
    Object.entries(rawLangs)
      .filter(([l]) => launchOptions.l.includes(l))
      .map(e => new Lang(...e))
  );

  //log("d", langs);
  //log("d", tests);
  fs.rmSync("tmp", { recursive: true, force: true });
  fs.mkdirSync("tmp");
  for (const test of tests) {
    log("s", `start test ${test.name}`);
    const src = test.src;
    for (const lang of langs) {
      pwd.toTmp();

      let buildStat;
      if (lang.build) buildStat = await lang.buildStat(src);
      console.log(buildStat);
      fs.rmSync(lang.out ?? src);

      //const exe = await lang.getSrc(test.src);
      //log("p", "src:" + exe);
    }
  }
  if (fs.existsSync("tmp")) fs.rmdirSync("tmp");
  process.chdir("../");
}
try {
  main();
} catch (err) {
  console.error(err);
}
