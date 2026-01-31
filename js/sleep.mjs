import process from "node:process";
const ms = +process.argv[2];
const start = Date.now();
while (Date.now() - start < ms) {}
