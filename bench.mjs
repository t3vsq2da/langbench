#!/usr/bin/env node
import { LBError, Cmd, isEmpty, setLog, log, Entries } from "./bench/utils.mjs";
import msgs, { format } from "./bench/msgs.mjs";
import LaunchOptions from "./bench/launchOptions.mjs";
import fs from "node:fs";
import Test from "./bench/test.mjs";
import Lang from "./bench/lang.mjs";
import process from "process";
import { fromStr } from "./bench/cmd.mjs";

let launchOptions;

let jsonFileObj;

let tableFileAppned;
let tableFileText;

const benchEntries = [];

async function main(langsCfg, testsCfg) {
  log("s", "init tests&langs");

  const langs = Object.entries(langsCfg).map(
    ([name, data]) => new Lang(name, data),
  );

  const tests = Object.entries(testsCfg).map(
    ([name, data]) => new Test(name, data),
  );

  log("s", "check langs src");
  tests.forEach(({ src }) => langs.forEach((lang) => lang.findSrc(src)));

  log("s", "run langs setup cmds");
  for (const l of langs) if (l.setup) await Cmd.exec(...fromStr(l.setup));

  log("d", "langs", langs);
  log("d", "tests", tests);

  fs.rmSync("tmp", { recursive: true, force: true });
  fs.mkdirSync("tmp");

  let startBenchTime = Date.now();

  for (let i = 0; i < tests.length; ++i) {
    const test = tests[i];
    log("s", `start test '${test.name}'`);

    const logCbStage = (tName, lName, langI) =>
      log(
        "s",
        msgs.tests.currentLang(
          tests.length,
          langs.length,
          tName,
          lName,
          i,
          langI,
        ),
      );
    const lBenchEntries = await test.benchLangs(langs, logCbStage);

    Entries.outEntriesTest(structuredClone(lBenchEntries));
    benchEntries.push(...lBenchEntries);
  }

  Entries.outEntriesTotal(benchEntries);

  log("");
  log(
    "s",
    "the benchmark was completed in " +
      format.time((Date.now() - startBenchTime) / 1000),
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
    Test.onLogAsserts = launchOptions.ls == 2;
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

mainWrapper();

const outsFiles = {
  init: () => {
    if (launchOptions.srt) {
      tableFileText = "";
      tableFileAppned = launchOptions.srt
        ? (txt) => (tableFileText += (txt != null ? txt : "") + "\n")
        : null;
    }
    if (launchOptions.srj) jsonFileObj = { total: null, entries: [] };
  },
  writeLo: (lo) => {
    tableFileAppned?.("launch options:\n" + lo + "\n");
    if (jsonFileObj && launchOptions.llo) jsonFileObj["launch options"] = lo;
  },
  save: () => {
    if (launchOptions.srt) fs.writeFileSync("bench-result.txt", tableFileText);

    if (launchOptions.srj)
      fs.writeFileSync("bench-result.json", JSON.stringify(jsonFileObj));
  },
};

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
