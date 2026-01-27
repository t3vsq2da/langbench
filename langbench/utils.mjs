import msgs from "./msgs.mjs";

export const pipe =
  (...funcs) =>
  arg =>
    funcs.reduce((a, f) => f(a), arg);

export const _ = Symbol("placeholder");
export const ALL = Symbol("all");

export { default as msgs } from "./msgs.mjs";

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

import { spawn } from "child_process";
import fs from "fs";

export const exec = (cmd, args) => {
  return new Promise((resolve, reject) => {
    if (args == null) args = [];
    else if (typeof args === "string") args = [args];

    log("c", "(", process.cwd(), ")", [cmd, ...args].join(" "));

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

//taskset -c 0,1,2,3
export const statCmd = async (cmd, args) => {
  if (args == null) args = [];
  else if (typeof args === "string") args = [args];

  const cmdSplitted = splitCmd(
    `/usr/bin/time -f "%U %S %M %P" ${cmd} ${args.join(" ")}`
  );
  cmd = cmdSplitted[0];
  args = cmdSplitted.slice(1);

  const { stdout, stderr, code } = await exec(cmd, args);

  const splittedRes = stderr.replace(/^'|'$/, "").split(" ");
  if (splittedRes.length != 4)
    throw new LBError(
      msgs.incorrectOutput(cmd + " " + args.join(" "), stdout, stderr, code)
    );

  const [utime, stime, mem, cpu] = splittedRes;
  return {
    stdout,
    stat: {
      time: Number(utime) + Number(stime),
      mem: Number(mem),
      cpu: parseInt(cpu),
    },
    code,
  };
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
  if (current !== "") args.push(current);
  return args;
};

export const excludeDisabled = (obj, fm) => {
  for (let key in obj) {
    if (key.startsWith("--")) {
      delete obj[key];
      continue;
    } else if (key.startsWith("++"))
      if (fm) {
        delete obj[key];
        continue;
      } else {
        obj[key.slice(2)] = obj[key];
        delete obj[key];
        key = key.slice(2);
      }

    if (isType("object")(obj[key])) obj[key] = excludeDisabled(obj[key]);
  }
  return obj;
};
