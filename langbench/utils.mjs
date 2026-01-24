export const pipe =
  (...funcs) =>
  arg =>
    funcs.reduce((a, f) => f(a), arg);

export const _ = Symbol("placeholder");
export const ALL = Symbol("all");

export const msgs = {
  validArgFail: (flag, values) =>
    `setting '${flag}' was passed an argument(s) '${
      Array.isArray(values) ? values.join(" ") : values
    }' that failed validation.`,
  noFlag: () => `a flag (option) must be specified before the values`,
  undefinedFlag: flag => `unknown flag '${flag}'`,
  incorrectType: (func, type, value) =>
    `@incorrectType: func:'${func}'\n expected:'${type}'\n value:'${value}'\n recivedType:'${typeof value}'`,
  srcNoFound: (lang, name) =>
    `file ${name} for language ${lang} was not found.`,
  specifyExt: lang =>
    `The source file of language ${lang} could not be identified. Specify the extension in the language configuration`,
  incorretOutput: (
    cmd,
    stdout,
    stderr,
    code
  ) => `incorrect output when running the command
cmd:'${cmd}' code:'${code}'
[stdout-start]\n${stdout}\n[stdout-end]
[stderr-start]\n${stderr}\n[stderr-end]
`,
};

export class LBError extends Error {
  constructor(msg) {
    super(msg);
    this.name = "LangBenchError";
    //console.error(msg, "\n");
  }
}

export const needLen = len => v => v.length === len;

export const isSet = arr => [...new Set(arr)].length === arr.length;

export const partial =
  (fn, ...preset) =>
  (...args) => {
    let i = 0;
    return fn(...preset.map(p => (p === _ ? args[i++] : p)));
  };

export const every =
  (...f) =>
  v =>
    [...f].every(f => f(v) === true);

export const autoCast = value => {
  const t = typeOf(value);
  if (t === "boolean" && typeof value == "string") return value === "true";
  else if (t === "number") return +value;
  else return value;
};

export const typeOf = value => {
  if (typeof value !== "string") return typeof value;
  else if (value === "") return "string";
  else if (value === "true" || value === "false") return "boolean";
  else if (value === "null") return "object";
  else if (value === "undefined") return "undefined";
  else if (/^-?\d+.?\d*$/.test(value)) return "number";
  else return "string";
};

export const isType = t => v => typeOf(v) === t;
export const inRange = (min, max, inclusive) => v =>
  v >= min && (inclusive === true ? v <= max : v < max);
export const head = a => a[0];

export const isEmpty = v =>
  v === null ||
  v === undefined ||
  (typeof v === "string" && !v.length) ||
  (typeof v === "object" && !Object.keys(v).length);

import { exec as nodeExec } from "node:child_process";

import { spawn } from "child_process";

export const exec = (cmd, args) => {
  return new Promise((resolve, reject) => {
    if (args == null) args = [];
    else if (typeof args === "string") args = [args];
    log("c", [cmd, ...args].join(" "));
    const child = spawn(cmd, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", data => (stdout += data.toString()));

    child.stderr.on("data", data => (stderr += data.toString()));

    child.on("error", reject);

    child.on("close", code =>
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code })
    );
  });
};

export const throwError = e => {
  throw e;
};

export const opposite = v =>
  typeof v === "boolean"
    ? !v
    : throwError(new LBError(msgs.incorrectType("opposite", "boolean", v)));

export const map =
  (...funcs) =>
  a =>
    a.map(pipe(...funcs));

let _log = (...msg) => (console.log("BASELOG:", ...msg), msg[0]);
export const log = (...a) => _log(...a);
export const setLog = l => (_log = l);

export const statCmd = async (cmd, args) => {
  if (args == null) args = [];
  else if (typeof args === "string") args = [args];

  args.unshift("-f", "'%U %S %M %P'", cmd);
  cmd = "/usr/bin/time";

  const { stdout, stderr, code } = await exec(cmd, args);

  const splitted = stderr.split(" ");
  if (splitted.length != 4)
    throw new LBError(
      msgs.incorretOutput(cmd + " " + args.join(" "), stdout, stderr, code)
    );

  const [utime, stime, mem, percen] = splitted;
  return { stdout, stat: { time: utime + stime, mem, percen }, code };
};

export const pwd = {
  toTmp: () => !process.cwd().endsWith("/tmp") && process.chdir("tmp"),
  toRoot: () => process.cwd().endsWith("/tmp") && process.chdir("../"),
};

export const splitCmd = str => {
  const args = [];
  let i = 0;
  let current = "";
  let inQuotes = false;
  let quoteChar = null;

  while (i < str.length) {
    const char = str[i];

    if (!inQuotes) {
      if (char === " ") {
        if (current !== "") {
          args.push(current);
          current = "";
        }
      } else if (char === '"' || char === "'") {
        inQuotes = true;
        quoteChar = char;
      } else current += char;
    } else {
      if (char === quoteChar) {
        inQuotes = false;
        quoteChar = null;
      } else if (char === "\\" && quoteChar === '"') {
        const next = str[i + 1];
        if (next === '"' || next === "\\" || next === "$") {
          current += next;
          i++;
        } else current += char;
      } else current += char;
    }

    i++;
  }
  //log("d", "splitCmd", '"' + str + '"', args);
  if (current !== "") args.push(current);
  return args;
};
