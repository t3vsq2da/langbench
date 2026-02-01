import msgs from "./msgs.mjs";
export * as Cmd from "./cmd.mjs";
export * as Entries from "./benchEntries.mjs";

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

  switch (value) {
    case "":
      return "string";
    case "null":
      return "object";
    case "undefined":
      return "undefined";
    case "true":
    case "false":
      return "boolean";
    default:
      return /^-?\d+\.?\d*$/.test(value) ? "number" : "string";
  }
};

export const isType = t => v => typeOf(v) === t;
export const inRange = (min, max, inclusive) => v =>
  v >= min && (inclusive === true ? v <= max : v < max);
export const isArray = Array.isArray;
export const head = a => a[0];

export const isEmpty = v =>
  v === null ||
  v === undefined ||
  (typeof v === "string" && !v.length) ||
  (typeof v === "object" && !Object.keys(v).length);

export const throwError = e => {
  throw e;
};

export const opposite = v =>
  typeof v === "boolean"
    ? !v
    : throwError(
        new LBError(msgs.utils.incorrectType("opposite", "boolean", v))
      );

export const map =
  (...funcs) =>
  a =>
    a.map(pipe(...funcs));

let _log = (...msg) => (console.log("::", ...msg), msg[0]);
export const log = (...a) => _log(...a);
export const setLog = l => (_log = l);

export const excludeDisabled = (obj, m) => {
  const excluded = {};
  const excludedValue = v =>
    typeof v == "object" && v != null && !isArray(v)
      ? excludeDisabled(v, m)
      : v;
  for (let key in obj) {
    const starts = key.slice(0, 2);
    const prefix = ["--", "++", "!!", "//"].find(p => p == starts);
    if (prefix == null) excluded[key] = excludedValue(obj[key]);
    else if (prefix == "--" || prefix == "//") continue;
    else if (prefix == "++" && m == "fast") continue;
    else if (prefix == "!!" && m != "detailed") continue;
    else excluded[key.slice(2)] = excludedValue(obj[key]);
  }
  return excluded;
};
