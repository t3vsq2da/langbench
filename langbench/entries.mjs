import { printEntriesTable } from "./msgs.mjs";

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

export const viewTest = (entries, testName, langsNames, forEachInputs) => {
  if (forEachInputs) {
    const inputs = [...new Set(entries.map(v => v.input))];
    inputs.forEach(input => {
      console.log();
      printEntriesTable(
        `${testName}[${input}]`,
        entries.filter(e => e.input == input)
      );
    });
  }

  console.log();
  printEntriesTable(testName, groupByLang(langsNames, entries));
};

export const viewTotal = (langsNames, entries) => {
  printEntriesTable("total", groupByLang(langsNames, entries));
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
