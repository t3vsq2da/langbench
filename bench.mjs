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

//const jsonFileOut =
let tableFileText = "";
const tableFileAppned = launchOptions.srt
  ? txt => (tableFileText += (txt != null ? txt : "") + "\n")
  : null;
let jsonFileObj = launchOptions.srt ? { total: null, tests: {} } : null;

const benchEntries = [];

async function main() {
  if (isEmpty(launchOptions)) return;
  launchOptions.sysInfo = await LaunchOptions.sysInfo();

  if ((await Cmd.exec("ls", "/usr/bin/time")).code)
    throw new LBError(msgs.langs.needReq("/usr/bin/time"));

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

  const langNames = langs.map(l => l.name);

  Test.attempts = launchOptions.ac;
  Entries.outSetSetting(launchOptions.li, tableFileAppned, jsonFileObj);

  fs.rmSync("tmp", { recursive: true, force: true });
  fs.mkdirSync("tmp");

  //const jsonFileOut = launchOptions.srj ? (txt)=>;
  //const tableFileOut = ;
  for (let i = 0; i < tests.length; ++i) {
    const test = tests[i];
    log("s", `start test ${test.name}`);
    const lBenchEntries = await test.benchLangs(langs, i, tests.length);

    Entries.outEntriesTest(
      lBenchEntries,
      test.name,
      langNames,
      launchOptions.li == 2
    );

    if (launchOptions.li) {
      //if (launchOptions.2srt) Entries.viewTest(...viewArgs, tableFileAppned);
      /* if (launchOptions.srj){
        if(jsonFileContent['test'])
          jsonFileContent['test'][]= */
    }

    benchEntries.push(...lBenchEntries.map(e => ((e.test = test.name), e)));
  }
  Entries.outEntriesTotal(langNames, benchEntries);

  if (launchOptions.lh) {
    log(msgs.launchOptions.sysInfo(launchOptions.sysInfo));
    if (launchOptions.srt)
      tableFileAppned(msgs.launchOptions.sysInfo(launchOptions.sysInfo));
  }

  if (fs.existsSync("tmp")) fs.rmSync("tmp", { force: true, recursive: true });

  if (launchOptions.srt)
    fs.writeFileSync("lang-bench-result.txt", tableFileText);

  if (launchOptions.srj)
    fs.writeFileSync("lang-bench-result.json", JSON.stringify(jsonFileObj));
}

const mainWrapper = async () => {
  try {
    await main();
  } catch (err) {
    if (err instanceof LBError) {
      console.error("\nLANG BENCH ERROR!");
      console.error(err.message);
    } else console.error(err);
  }
};

mainWrapper();
