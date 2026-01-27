import {
  pwd,
  exec,
  LBError,
  msgs,
  isEmpty,
  setLog,
  log,
} from "./langbench/utils.mjs";
import { statsToRow } from "./langbench/msgs.mjs";
import LaunchOptions from "./langbench/launchOptions.mjs";
import fs from "node:fs";
import Test from "./langbench/test.mjs";
import Lang from "./langbench/lang.mjs";

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
  w: "[w]", //warn
  i: "[i]", //individual
  s: "[s]", //stage
  c: "[c]", //command
  a: "[a]", //attempt
  d: "[d]", //debug
};

const benchEntries = [];

import os from "os";

const totalTimeLang = (lang, entries) => {
  const filtred = benchEntries.filter(e => e.lang == lang);
  const total = filtred[0];
  filtred.slice(1)?.forEach?.(e => {
    total.time += e.time;
    total.mem += e.mem;
    total.cpu += e.cpu;
    if (total.build) {
      total.build.time += e.build.time;
      total.build.size += e.build.size;
    }
  });
  total.cpu = total.cpu / filtred.length;
  return total;
};

async function main() {
  if ((await exec("ls", "/usr/bin/time")).code)
    throw new LBError(msgs.needReq("/usr/bin/time"));

  if (launchOptions.mc > (await launchOptions.sysInfo).cpu.logicalCores)
    throw new LBError(msgs.validArgFail("mc", launchOptions.mc));

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
    const srcName = test.src;

    const lBenchEntries = [];
    for (let j = 0; j < langs.length; ++j) {
      const lang = langs[j];
      let buildStat;
      if (lang.build) buildStat = await lang.buildStat(srcName);
      let cmdRun = lang.getRunCmd(srcName);

      log(
        "s",
        `[test ${i + 1}/${tests.length} | lang ${j + 1}/${langs.length}] "${
          test.name
        }" (${lang.name})`
      );
      const benchResult = await test.bench(
        cmdRun,
        launchOptions.la && lang.name
      );

      for (const input in benchResult) {
        const lBenchEntry = benchResult[input];
        lBenchEntry.lang = lang.name;
        lBenchEntry.input = input;
        if (buildStat) lBenchEntry.build = buildStat;
        lBenchEntries.push(lBenchEntry);
      }
      pwd.toTmp();
      fs.rmSync(lang.out ?? srcName, { force: true });
    }
    if (launchOptions.li) {
      const inputs = [...new Set(lBenchEntries.map(v => v.input))];
      inputs.forEach(input => {
        console.log("");
        msgs.table(
          `${test.name}[${input}]`,
          ["lang", "time", "mem", "cpu%", "build time", "build size"],
          statsToRow(lBenchEntries.filter(e => e.input == input))
        );
      });
      console.log("");
      msgs.table(
        `${test.name}`,
        ["lang", "time", "mem", "cpu%", "build time", "build size"],
        statsToRow(lBenchEntries)
      );
    }
    benchEntries.push(...lBenchEntries.map(e => ((e.test = test.name), e)));
  }
  const totalEntries = [];
  for (let { name } of langs) {
    totalEntries.push(totalTimeLang(name, benchEntries));
  }

  console.log("");
  msgs.table(
    `total`,
    ["lang", "time", "mem", "cpu%", "build time", "build size"],
    statsToRow(totalEntries)
  );

  if (launchOptions.si) console.log(launchOptions.sysInfo);

  pwd.toRoot();
  if (fs.existsSync("tmp")) fs.rmdirSync("tmp");
}
try {
  main();
} catch (err) {
  console.error(err);
}
