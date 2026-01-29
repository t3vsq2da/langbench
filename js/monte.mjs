import { argv } from "process";

const n = Number(argv[2]);
let inside = 0;

for (let i = 0; i < n; i++) {
  const x = Math.random();
  const y = Math.random();
  if (x * x + y * y <= 1.0) inside++;
}

console.log((4.0 * inside) / n);
