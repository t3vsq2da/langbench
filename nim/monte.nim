# monte.nim
import os, random, strutils

let n = paramStr(1).parseInt()

const SCALE = 1_000_000_000
var inside = 0
for i in 0..<n:
  let x = rand(SCALE).float / SCALE.float
  let y = rand(SCALE).float / SCALE.float
  if x * x + y * y <= 1.0:
    inc inside

echo 4.0 * float(inside) / float(n)