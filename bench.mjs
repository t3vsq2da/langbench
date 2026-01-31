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
import { format } from "./langbench/msgs.mjs";
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

let tableFileText = "";
const tableFileAppned = launchOptions.srt
  ? txt => (tableFileText += (txt != null ? txt : "") + "\n")
  : null;
let jsonFileObj = launchOptions.srt ? { total: null, entries: [] } : null;

const benchEntries = [];

async function main() {
  if (isEmpty(launchOptions)) return;

  if ((await Cmd.exec("ls", "/usr/bin/time")).code)
    throw new LBError(msgs.langs.needReq("/usr/bin/time"));

  if ((await Cmd.exec("which", "taskset")).code)
    throw new LBError(msgs.langs.needReq("taskset"));

  launchOptions.sysInfo = await LaunchOptions.sysInfo();

  const logCores = launchOptions.sysInfo.cpu.logicalCores;

  if (launchOptions.mt == null)
    launchOptions.mt = Math.min(4, Math.max(logCores - 1, 1));
  else if (launchOptions.mt != null && launchOptions.mt >= logCores)
    throw new LBError(msgs.launchOptions.validArgFail("mt", launchOptions.mt));

  log(
    "o",
    Object.entries(launchOptions)
      .map(([k, v]) => k + ":" + v)
      .join("\n")
  );

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
  Test.maxThreads = launchOptions.mt;
  Entries.outSetSetting(launchOptions.li, tableFileAppned, jsonFileObj);

  fs.rmSync("tmp", { recursive: true, force: true });
  fs.mkdirSync("tmp");

  let startBenchTime = Date.now();

  for (let i = 0; i < tests.length; ++i) {
    const test = tests[i];
    log("s", `start test ${test.name}`);

    const lBenchEntries = await test.benchLangs(langs, i, tests.length);

    Entries.outEntriesTest(structuredClone(lBenchEntries));
    benchEntries.push(...lBenchEntries);
  }

  Entries.outEntriesTotal(benchEntries);

  if (launchOptions.lo) {
    const sysInfo = msgs.launchOptions.sysInfo(launchOptions.sysInfo);
    log(sysInfo);
    if (launchOptions.srt) tableFileAppned(sysInfo);
    if (launchOptions.srj) jsonFileObj.system = launchOptions.sysInfo;
  }

  if (launchOptions.srt) fs.writeFileSync("bench-result.txt", tableFileText);

  if (launchOptions.srj)
    fs.writeFileSync("bench-result.json", JSON.stringify(jsonFileObj));

  log(
    "s",
    "the benchmark was completed in " +
      format.time((Date.now() - startBenchTime) / 1000)
  );
}

const mainWrapper = async () => {
  try {
    await main();
  } catch (err) {
    if (err instanceof LBError) {
      console.error("\nLANG BENCH ERROR!");
      console.error(err.message);
    } else console.error(err);
  } finally {
    if (fs.existsSync("tmp"))
      fs.rmSync("tmp", { force: true, recursive: true });
  }
};

mainWrapper();
