import { default as msgs, format } from "./msgs.mjs";

export const parseBecnhResult = (benchResult, langName, buildStat) => {
  const entries = [];
  for (const input in benchResult) {
    const lBenchEntry = benchResult[input];
    lBenchEntry.lang = langName;
    lBenchEntry.input = input;
    if (buildStat) lBenchEntry.build = buildStat;
    entries.push(lBenchEntry);
  }
  return entries;
};

let outSetting = {};

export const outSetSetting = (li, srtFn, srjObj) =>
  (outSetting = { li, srtFn, srjObj });

export const outEntriesTest = (
  entries,
  testName,
  langsNames,
  forEachInputs
) => {
  /* console.log("e:");
  console.log(entries); */
  viewTest(entries, testName, langsNames, forEachInputs);
  if (outSetting.srtFn)
    viewTest(entries, testName, langsNames, forEachInputs, outSetting.srtFn);
  if (outSetting.srjObj) {
    //console.log(outSetting.srjObj.tests[testName]);
    if (outSetting.srjObj.tests[testName])
      outSetting.srjObj.tests[testName].push(...entries);
    else outSetting.srjObj.tests[testName] = entries;
    //console.log("after", outSetting.srjObj.tests[testName]);
  }
};

export const outEntriesTotal = (langsNames, entries) => {
  const grouped = groupByLang(langsNames, entries);
  viewEntries("total", grouped);
  if (outSetting.srtFn) viewEntries("total", grouped, outSetting.srtFn);
  if (outSetting.srjObj) outSetting.srjObj["total"] = grouped;
};

const sortBenchEntries = (a, b) => a.time - b.time;

export const viewEntries = (head, entries, out = console.log) => {
  out();
  out(
    msgs.table(
      head,
      ["lang", "time", "mem", "cpu%", "build time", "build size"],
      format.benchEntires(entries.sort(sortBenchEntries))
    )
  );
};
export const viewTest = (entries, testName, langsNames, forEachInputs, out) => {
  if (forEachInputs) {
    const inputs = [...new Set(entries.map(v => v.input))];
    inputs.forEach(input => {
      viewEntries(
        `${testName}[${input}]`,
        entries.filter(e => e.input == input),
        out
      );
    });
  }

  viewEntries(testName, groupByLang(langsNames, entries), out);
};

const groupByLang = (langsNames, entries) => {
  const res = [];
  for (let lang of langsNames) res.push(totalStatLang(lang, entries));
  return res;
};

const totalStatLang = (lang, entries) => {
  const filtred = entries.filter(e => e.lang == lang);
  const total = filtred[0];
  filtred.slice(1)?.forEach?.(e => {
    total.time += e.time;
    total.mem += e.mem;
    total.cpu += e.cpu;
  });
  total.cpu = total.cpu / filtred.length;
  return total;
};
