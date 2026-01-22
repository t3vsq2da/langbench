import {
  pipe,
  _,
  ALL,
  partial,
  every,
  autoCast,
  typeOf,
  isType,
  inRange,
  head,
  isEmpty,
  tail
} from "./utils.mjs";
import { exec as nodeExec } from "node:child_process";
import fs, { readdirSync } from "node:fs";
import path from "node:path";

const tests = { t1: 1, t2: 2 };
const langs = { l1: 1, l2: 2 };

const coreCount = () => (console.log("TODO CORE COUNT"), 4);

export const log = (t, ...msg) =>
  launchOptions["l" + t] === true && console.log("[" + t + "]", ...msg);

const needLen = (len)=>value=>value.length===len

const launchOptionsChecks = {
  //log additional | дополнительное логирование
  la: every(needLen(1), pipe(head,isType("boolean"))),
  //log individual tests | выводит результаты каждого теста
  li: pipe(head, isType("boolean")),
  //log debug
  ld: pipe(head, isType("boolean")),
  //tests
  t: (tNames) => tNames.every((tName) => Object.keys(tests).includes(tName)),
  //langs
  l: (lNames) => lNames.every((lName) => Object.keys(langs).includes(lName)),
  //dif
  d: pipe(head, isType("boolean")),
  //attemps count
  ac: pipe(
    head,
    every(Number.isInteger, (n) => n > 0)
  ),
  //fast mode
  fm: pipe(head, isType("boolean")),
  //sort by Time, maxMem averageMem buildSize buildTime
  sb: (words) => words.every((w) => ["t", "mm", "am", "bs", "bt"].includes(w)),
  //min cpu %
  mcp: pipe(head, every(Number.isInteger, inRange(1, 100))),
  //max cores
  mc: pipe(head, every(Number.isInteger, inRange(1, coreCount()))),
};

const launchOptions = (function (args) {
  const defaultOptions = {
    la: false,
    li: true,
    ld: false,
    t: ALL,
    l: ALL,
    d: false,
    ac: 3,
    fm: false,
    sb: ["t", "am", "mm", "bs", "bt"],
    mcp: 95,
    mc: 4,
  };
  for (let i = 2; i < args.length; )
    if (args[i].startsWith("-")) {
      const flag = args[i].slice(1);
      if (!flag in launchOptionsChecks)
        throw new LBError(`unknown flag '${flag}'`);
      let values = [];
      while (args[++i] != null && !args[i].startsWith("-")) {
        values.push(args[i]);
      }
      if (!values.length) values = [true];
      console.log(values)
      values = values.map((v) => autoCast(v));
      console.log(values)
      if (!launchOptionsChecks[flag](values)) console.error("OOPS", flag);
    }

  //else

  return defaultOptions;
})(process.argv);
