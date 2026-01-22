export const pipe =
  (...funcs) =>
  arg =>
    funcs.reduce((a, f) => f(a), arg);

export const _ = Symbol("placeholder");
export const ALL = Symbol("all");

export const msgs = {
  validArgFail:(flag,values)=>`setting '${flag}' was passed an argument(s) '${
            Array.isArray(values) ? values.join(" ") : values
          }' that failed validation.`,
  noFlag:()=>`a flag (option) must be specified before the values.`,
  undefinedFlag:(flag)=>`unknown flag '${flag}'`,
}

export class LBError extends Error {
  constructor(msg) {
    super(msg);
    this.name = "LangBenchError";
    console.error(msg, "\n");
  }
}

export const isSet = arr=>[...new Set(arr)].length===arr.length

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

import { spawn } from 'child_process';

export const gExec = log=>cmd=>{
  return new Promise((resolve, reject) => {
    log('c',cmd.trim())
    
    const child = spawn(cmd, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', data => 
      stdout += data.toString()
    );

    child.stderr.on('data', data => 
      stderr += data.toString());

    child.on('error', reject);

    child.on('close', (code) => 
      resolve({ stdout, stderr, code }));
  });
}