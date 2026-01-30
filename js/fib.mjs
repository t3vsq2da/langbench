import { argv } from "node:process";

const n = Number(argv[2]);

function fib(n) {
  return n <= 1 ? n : fib(n - 1) + fib(n - 2);
}
console.log(fib(n));
