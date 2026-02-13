import { default as msgs, format } from "./msgs.mjs";

export const parseBecnhResult = (benchResult, testName, langName, buildStat) =>
  Object.keys(benchResult).map((input) => ({
    ...benchResult[input],
    lang: langName,
    test: testName,
    input,
    ...(buildStat && { build: buildStat }),
  }));

export const outEntriesTest = (entries) => {
  viewTest(entries);
  outSetting.srjObj?.entries.push(...entries);
};

export const viewTest = (entries) => {
  const testName = entries[0].test;
  if (outSetting.li == 0) return;
  else if (outSetting.li == 2) {
    const inputs = [...new Set(entries.map((v) => v.input))];
    inputs.forEach((input) => {
      viewEntries(
        `${testName}[${input}]`,
        entries.filter((e) => e.input == input),
      );
    });
  }

  viewEntries(testName, groupByLang(entries));
};

export const outEntriesTotal = (entries) => {
  const grouped = groupByLang(entries);
  viewEntries("total", grouped);
  if (outSetting.srjObj) outSetting.srjObj.total = grouped;
};

export const viewEntries = (head, entries) => {
  outSetting.outputs.forEach((out) => {
    out(); //newline
    out(
      msgs.table(
        head,
        ["lang", "time", "mem", "cpu%", "build time", "build size"],
        format.benchEntires(entries.sort(sortBenchEntries)),
      ),
    );
  });
};

let outSetting = {};
export const outSetSetting = (li, srtFn, srjObj) =>
  (outSetting = { li, outputs: [console.log, srtFn].filter(Boolean), srjObj });
const sortBenchEntries = (a, b) => a.time - b.time || a.mem - b.mem;

const groupByLang = (entries) =>
  [...new Set(entries.map((e) => e.lang))].map((lang) => {
    const [first, ...filtered] = entries.filter((e) => e.lang === lang);
    return filtered.reduce((total, curr, i) => {
      total.time += curr.time;
      total.mem += curr.mem;
      total.cpu += curr.cpu;
      if (total.build) {
        total.build.time += curr.build.time;
        total.build.size += curr.build.size;
      }
      if (i === filtered.length - 1) total.cpu /= filtered.length + 1;
      return total;
    }, structuredClone(first));
  });
