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
  i: "[+]", //individual
  s: "[#]", //stage
  c: "[$]", //command
  a: "[~]", //attempt
  d: "[@]", //debug
};

async function main() {
  log("s", "init tests&langs");
  const tests = Test.getEnabled(
    JSON.parse(fs.readFileSync("./tests.json")),
    launchOptions.t
  );
  const langs = Lang.getEnabled(
    JSON.parse(fs.readFileSync("./langs.json")),
    launchOptions.l
  );

  Test.attempts = launchOptions.ac;

  //log("d", langs);
  //log("d", tests);
  fs.rmSync("tmp", { recursive: true, force: true });
  fs.mkdirSync("tmp");

  for (const test of tests) {
    log("s", `start test ${test.name}`);
    for (const lang of langs) {
      pwd.toTmp();

      let buildStat;
      console.log("||", test.src);
      let src;
      let cmdRun;
      if (lang.build) {
        buildStat = await lang.buildStat(test.src);
        cmdRun = lang.run?.replace("<src>", test.src) ?? "./" + test.src;
      } else
        cmdRun = lang.run?.replace(
          "<src>",
          path.join("../", lang.findSrc(test.src))
        );

      console.log(lang.name, test.name, await test.bench(cmdRun));
      pwd.toTmp();
      console.log(">>", test.src);
      fs.rmSync(lang.out ?? test.src, { force: true });

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
