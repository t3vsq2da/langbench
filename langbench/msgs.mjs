const msgs = {
  launchOptions: {
    validArgFail: (flag, values) =>
      `setting '${flag}' was passed an argument(s) '${
        Array.isArray(values) ? values.join(" ") : values
      }' that failed validation.`,
    incompatibleOptions: (opt1, opt2) =>
      `Options '${opt1}' and options '${opt2}' are not compatible`,
    noFlag: () => `a flag (option) must be specified before the values`,
    undefinedFlag: flag => `unknown flag '${flag}'`,
    sysInfo: ({ cpu, disks, os }) => `\ncpu: '${cpu.model}' (${
      cpu.logicalCores
    } threads)
discs: '${disks.join(" ")}'
os: ${os.platform}(${os.release}) arch:${os.arch}`,
    undefinedName: (file, name) =>
      `name ${name} was not found in config ${file}`,
    needReq: (nameE, req) => `requires dependency '${req}' for '${nameE}'`,
  },
  utils: {
    execCommandFail: (
      cmd,
      stdout,
      stderr,
      code
    ) => `No zero code when running the command
cmd:'${cmd}' code:'${code}'\
${stdout?.trim().length ? `\n[stdout-start]\n${stdout}\n[stdout-start]` : ""}\
${stderr?.trim().length ? `\n[stderr-start]\n${stderr}\n[stderr-end]` : ""}`,
    incorrectType: (func, type, value) =>
      `@incorrectType: func:'${func}'\n expected:'${type}'\n value:'${value}'\n recivedType:'${typeof value}'`,
    incorrectOutput: (
      cmd,
      stdout,
      stderr,
      code
    ) => `incorrect output when running the command
cmd:'${cmd}' code:'${code}'\
${stdout?.trim().length ? `\n[stdout-start]\n${stdout}\n[stdout-start]` : ""}\
${stderr?.trim().length ? `\n[stderr-start]\n${stderr}\n[stderr-end]` : ""}`,
    incorrectRes: (
      testName,
      cmd,
      code,
      expected,
      stdout,
      stderr
    ) => `incorrect result when performing test '${testName}'
cmd:'${cmd}' code:'${code}'
[expected-stdout-start]\n${expected}\n[expected-stdout-end]
[stdout-start]\n${stdout}\n[stdout-start]\
${stderr?.trim().length ? `\n[stderr-start]\n${stderr}\n[stderr-end]` : ""}`,
  },
  langs: {
    srcNoFound: (lang, folder, name) =>
      `src '${name}' in dir '${folder}' for language '${lang}' was not found.`,
    specifyExt: lang =>
      `the source file of language '${lang}' could not be identified. Specify the extension in the language configuration`,
    missedFieldLang: (lName, field) =>
      `missing field '${field}' in the programming language configuration '${lName}'`,
    langNoRun: langName =>
      `it is not possible to define a command to run in language '${langName}'`,
  },
  tests: {
    missedFieldTest: (tName, field) =>
      `missing field '${field}' in test configuration '${tName}'`,
  },
  benchEntires: e =>
    `t:${format.time(e.time)} m:${format.mem(e.mem)} cpu%:${e.cpu}`,
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
    const res = [];
    res.push(pad(title, rowWidth, "="));
    res.push(formatRow(headers));
    res.push("-".repeat(rowWidth));
    res.push(...rows.map(formatRow));
    res.push("=".repeat(rowWidth));
    return res.join("\n");
  },
};

export const format = {
  time: t => {
    t = Number(t);
    return t > 100 ? (t / 60).toFixed(2) + "m" : t.toFixed(2) + "s";
  },
  mem: m => {
    m = Number(m);
    const prefixs = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    while (m > 2048) {
      m /= 1024;
      ++i;
    }
    return Number.isInteger(m) ? m : m.toFixed(1) + prefixs[i];
  },
  benchEntires: entries => {
    const rows = entries.map(stat => [
      stat.lang,
      format.time(stat.time),
      format.mem(stat.mem),
      stat.cpu.toFixed(1),
      stat?.build?.time ? format.time(stat.build.time) : "-",
      stat?.build?.size ? format.mem(stat.build.size) : "-",
    ]);
    return rows;
  },
};

export default msgs;
