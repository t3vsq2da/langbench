import {
  pipe,
  _,
  msgs,
  isSet,
  ALL,
  partial,
  every,
  autoCast,
  typeOf,
  isType,
  inRange,
  head,
  isEmpty,
  LBError,
  gExec,
} from "./langbench/utils.mjs";
import launchOptions from './langbench/launchOptions.mjs'
import fs, { readdirSync } from "node:fs";
import path from "node:path";

const tests = { t1: 1, t2: 2 };
const langs = { l1: 1, l2: 2 };

const log = (head,tail) => {
  if(tail==null)
    console.log(head);
  else
    if(launchOptions['l'+head]){
      const prefix = log.prefixs[head];
      if(prefix)
        console.log(prefix,tail)
      else
        console.log(tail)
    }
};

log.prefixs = {
  w: "[!]",//warn
  i: "", //individual
  s: "[#]",//stage
  c: "[$]",//command
  a: "[~]",//attempt
  d: "[@]",//debug
};

const exec = gExec(log);

(async ()=>{
  log('i','hi')
  log('w','hi')
  console.log(await exec('ls'))
})()