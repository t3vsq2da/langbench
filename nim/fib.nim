import os, strutils

let n = parseInt(paramStr(1))

proc fib(n: int): int =
  if n <= 1:
    n
  else:
    fib(n - 1) + fib(n - 2)

echo fib(n)
