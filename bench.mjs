#!/usr/bin/env node
import {
  LBError,
  msgs,
  isEmpty,
  setLog,
  log,
  Cmd,
  Entries,
} from "./langbench/utils.mjs";
import LaunchOptions from "./langbench/launchOptions.mjs";
import fs from "node:fs";
import Test from "./langbench/test.mjs";
import Lang from "./langbench/lang.mjs";
import process from "process";

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
  i: "[i]", //individual
  s: "[s]", //stage
  c: "[c]", //command
  a: "[a]", //attempt
  d: "[d]", //debug
};

const benchEntries = [];

async function main() {
  if (isEmpty(launchOptions)) return;
  launchOptions.sysInfo = await LaunchOptions.sysInfo();
  if ((await Cmd.exec("ls", "/usr/bin/time")).code)
    throw new LBError(msgs.needReq("/usr/bin/time"));

  log("s", "init tests&langs");
  const tests = Test.getEnabled(
    JSON.parse(fs.readFileSync("./tests.json")),
    launchOptions.t,
    launchOptions.fm
  );
  const langs = await Lang.getEnabled(
    JSON.parse(fs.readFileSync("./langs.json")),
    launchOptions.l,
    launchOptions.fm
  );

  if (langs.length == 0 || tests.length == 0) return;

  log("d", "tests:", tests);
  log("d", "langs:", langs);

  Test.attempts = launchOptions.ac;

  fs.rmSync("tmp", { recursive: true, force: true });
  fs.mkdirSync("tmp");

  for (let i = 0; i < tests.length; ++i) {
    const test = tests[i];
    log("s", `start test ${test.name}`);
    const lBenchEntries = await test.benchLangs(langs, i, tests.length);

    if (launchOptions.li)
      Entries.viewTest(
        lBenchEntries,
        test.name,
        langs.map(v => v.name),
        launchOptions.li == 2
      );
    benchEntries.push(...lBenchEntries.map(e => ((e.test = test.name), e)));
  }
  log("");
  Entries.viewTotal(
    langs.map(v => v.name),
    benchEntries
  );

  if (launchOptions.lh) {
    log("");
    log(msgs.sysInfo(launchOptions.sysInfo));
  }

  if (fs.existsSync("tmp")) fs.rmSync("tmp", { force: true, recursive: true });
}

try {
  main();
} catch (err) {
  console.error(err);
}
