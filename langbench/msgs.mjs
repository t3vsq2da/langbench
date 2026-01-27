const msgs = {
  validArgFail: (flag, values) =>
    `setting '${flag}' was passed an argument(s) '${
      Array.isArray(values) ? values.join(" ") : values
    }' that failed validation.`,
  noFlag: () => `a flag (option) must be specified before the values`,
  undefinedFlag: flag => `unknown flag '${flag}'`,
  incorrectType: (func, type, value) =>
    `@incorrectType: func:'${func}'\n expected:'${type}'\n value:'${value}'\n recivedType:'${typeof value}'`,
  srcNoFound: (lang, name) =>
    `file ${name} for language '${lang}' was not found.`,
  specifyExt: lang =>
    `The source file of language '${lang}' could not be identified. Specify the extension in the language configuration`,
  undefinedTest: name => `unrecognized test name '${name}'`,
  undefinedLang: name => `unrecognized lang name '${name}'`,
  needReq: (lName, req) => `Language '${lName}' requires dependency '${req}'`,
  incorrectOutput: (
    cmd,
    stdout,
    stderr,
    code
  ) => `incorrect output when running the command
cmd:'${cmd}' code:'${code}'
${stdout != null ? `[stdout-start]\n${stdout}\n[stdout-start]` : ""}
${stderr.trim() != null ? `[stderr-start]\n${stderr}\n[stderr-end]` : ""}
`,
  incorrectRes: (
    testName,
    cmd,
    code,
    expected,
    stdout
  ) => `incorrect result when performing test '${testName}'
cmd:'${cmd}' code:'${code}'
[expected-stdout-start]\n${expected}\n[expected-stdout-end]
[stdout-start]\n${stdout}\n[stdout-start]`,
  langNoRun: langName =>
    `it is not possible to define a command to run in language '${langName}'`,
  formatStat: {
    time: t => {
      t = Number(t);
      return t > 100 ? (t / 60).toFixed(2) + "m" : t.toFixed(2) + "s";
    },
    mem: m => {
      m = Number(m);
      const prefixs = ["B", "KB", "MB", "GB"];
      let i = 0;
      while (m > 2048) {
        m /= 1024;
        ++i;
      }
      return Number.isInteger(m) ? m : m.toFixed(1) + prefixs[i];
    },
    stat: s =>
      `t:${msgs.formatStat.time(s.time)} m:${msgs.formatStat.mem(s.mem)} cpu%:${
        s.cpu
      }`,
  },
  table: (title, headers, rows) => {
    headers = headers.map(h => h.toString().trim());
    rows = rows.map(row => row.map(ceil => ceil.toString().trim()));

    let ceilWidths = [];
    const updateWidth = (str, index) => {
      if (ceilWidths[index])
        ceilWidths[index] = Math.max(str.length, ceilWidths[index]);
      else ceilWidths[index] = str.length;
    };

    rows.forEach(row => {
      row.forEach(updateWidth);
    });
    headers.forEach(updateWidth);

    let rowWidth = Math.max(
      title.length + 2,
      headers.join("").length + (headers.length - 1) * 3,
      ceilWidths.reduce((a, v) => a + v, 0) + (headers.length - 1) * 3
    );

    const pad = (str, width, char) => {
      const indent = (width - str.length) / 2;
      return (
        char.repeat(Math.floor(indent)) + str + char.repeat(Math.ceil(indent))
      );
    };
    const formatRow = row => {
      return row.map((ceil, i) => pad(ceil, ceilWidths[i], " ")).join(" | ");
    };
    //console.log("\n");
    console.log(pad(title, rowWidth, "="));
    console.log(formatRow(headers));
    console.log("-".repeat(rowWidth));
    rows.map(formatRow).forEach(c => console.log(c));
    console.log("=".repeat(rowWidth));
  },
};

export const statsToRow = stats => {
  const rows = stats.map(stat => [
    stat.lang,
    msgs.formatStat.time(stat.time),
    msgs.formatStat.mem(stat.mem),
    stat.cpu,
    stat?.build?.time ? msgs.formatStat.time(stat.build.time) : "-",
    stat?.build?.size ? msgs.formatStat.mem(stat.build.size) : "-",
  ]);
  return rows;
};

export default msgs;
