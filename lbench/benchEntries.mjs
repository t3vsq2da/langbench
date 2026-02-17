import { default as msgs, format } from "./msgs.mjs";
import { show } from "./utils.mjs";

export const parseBecnhResult = (benchResult, testName, langName, buildStat) =>
  Object.keys(benchResult).map((input) => ({
    ...benchResult[input],
    lang: langName,
    test: testName,
    input,
    ...(buildStat && { build: buildStat }),
  }));

export const outEntriesTest = (entries) => {
  showTest(entries);
};

let jsonOut;
let txtOut;
export const setJsonOut = (o) => (jsonOut = o);
export const setTxtOut = (o) => (txtOut = o);

export const showTest = (entries) => {
  const testName = entries[0].test;

  const inputs = [...new Set(entries.map((v) => v.input))];
  inputs.forEach((input) => {
    show("ec", ""); //endl
    txtOut.add(
      "\n\n" +
        show(
          "ec",
          tableEntries(
            `${testName}[${input}]`,
            entries.filter((e) => e.input == input),
          ),
        ),
    );
  });
  show("et", ""); //endl
  jsonOut.add({ entries: [...entries] });
  txtOut.add("\n\n" + show("et", tableEntries(testName, groupByLang(entries))));
};

export const outEntriesTotal = (entries) => {
  const grouped = groupByLang(entries);
  show("o", ""); //endl
  txtOut.add("\n\n" + show("o", tableEntries("total", grouped)));
  jsonOut.set({ total: grouped });
};

export const tableEntries = (head, entries) => {
  return msgs.table(
    head,
    ["lang", "time", "mem", "cpu%", "build time", "build size"],
    format.benchEntires(entries.sort(sortBenchEntries)),
  );
};

const sortBenchEntries = (a, b) => a.time - b.time || a.mem - b.mem;

const groupByLang = (entries) => {
  entries = structuredClone(entries);
  return [...new Set(entries.map((e) => e.lang))].map((lang) => {
    entries.forEach((e) => (delete e.input, delete e.test));
    const [first, ...filtered] = entries.filter((e) => e.lang === lang);
    return filtered.reduce((total, curr, i) => {
      total.time += curr.time;
      total.etime += curr.etime;
      total.mem += curr.mem;
      total.cpu += curr.cpu;
      if (total.build) {
        total.build.time += curr.build.time;
        total.build.size += curr.build.size;
      }
      if (i === filtered.length - 1) total.cpu /= filtered.length + 1;
      return total;
    }, first);
  });
};
