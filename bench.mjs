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

let launchOptions;

let jsonFileObj;

let tableFileAppned;
let tableFileText;

const benchEntries = [];

async function main(langsCfg, testsCfg) {
  log("s", "init tests&langs");

  const langs = Object.entries(langsCfg).map(
    ([name, data]) => new Lang(name, data)
  );

  const tests = Object.entries(testsCfg).map(
    ([name, data]) => new Test(name, data)
  );

  log("d", "langs", langs);
  log("d", "tests", tests);

  fs.rmSync("tmp", { recursive: true, force: true });
  fs.mkdirSync("tmp");

  let startBenchTime = Date.now();

  for (let i = 0; i < tests.length; ++i) {
    const test = tests[i];
    log("s", `start test ${test.name}`);

    const logCb = (tName, lName) =>
      log(
        "s",
        `[test ${i + 1}/${test.length} | lang ${j + 1}/${
          langs.length
        }] "${tName}" (${lName})`
      );
    const lBenchEntries = await test.benchLangs(langs, logCb);

    Entries.outEntriesTest(structuredClone(lBenchEntries));
    benchEntries.push(...lBenchEntries);
  }

  Entries.outEntriesTotal(benchEntries);

  log(
    "s",
    "the benchmark was completed in " +
      format.time((Date.now() - startBenchTime) / 1000)
  );
}

const mainWrapper = async () => {
  try {
    launchOptions = new LaunchOptions(process.argv);
    if (isEmpty(launchOptions)) return 0;

    await launchOptions.init();
    if (isEmpty(launchOptions.langs) || isEmpty(launchOptions.tests)) return;

    outsFiles.init();
    outsFiles.writeLo(log("lo", launchOptions.toString()));

    Test.attempts = launchOptions.ac;
    Test.maxThreads = launchOptions.mt;
    Entries.outSetSetting(launchOptions.li, tableFileAppned, jsonFileObj);

    await main(launchOptions.langs, launchOptions.tests);

    outsFiles.save();
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

const outsFiles = {
  init: () => {
    if (launchOptions.srt) {
      tableFileText = "";
      tableFileAppned = launchOptions.srt
        ? txt => (tableFileText += (txt != null ? txt : "") + "\n")
        : null;
    }
    if (launchOptions.srj) jsonFileObj = { total: null, entries: [] };
  },
  writeLo: lo => {
    tableFileAppned?.("launch options:\n" + lo + "\n");
    if (jsonFileObj && launchOptions.llo) jsonFileObj["launch options"] = lo;
  },
  save: () => {
    if (launchOptions.srt) fs.writeFileSync("bench-result.txt", tableFileText);

    if (launchOptions.srj)
      fs.writeFileSync("bench-result.json", JSON.stringify(jsonFileObj));
  },
};

mainWrapper();

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
  lo: "[lo]", //launch options
};
