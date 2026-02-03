import std/[os, strutils, math, locks]

type
  LCG = object
    state: uint64

  ThreadContext = object
    id: int
    iterations: int64
    hits: ptr int64
    lock: ptr Lock
    completed: ptr int

proc initLCG(seed: uint64): LCG =
  LCG(state: seed)

proc next(rng: var LCG): uint64 =
  rng.state = rng.state * 6364136223846793005'u64 + 1442695040888963407'u64
  result = rng.state

proc randDouble(rng: var LCG): float =
  let n = rng.next().float
  result = n / 18446744073709551616.0

proc worker(ctx: ptr ThreadContext) {.thread.} =
  var rng = initLCG(ctx.id.uint64)
  var localHits: int64 = 0

  for i in 0 ..< ctx.iterations:
    let x = rng.randDouble()
    let y = rng.randDouble()
    if x*x + y*y <= 1.0:
      inc localHits

  # Сохраняем результат
  ctx.hits[] = localHits

  # Увеличиваем счетчик завершенных потоков
  acquire(ctx.lock[])
  inc(ctx.completed[])
  release(ctx.lock[])

proc parallelPi(threads: int, total: int64): float =
  var
    threadsArr: array[256, Thread[ptr ThreadContext]]
    contexts: array[256, ThreadContext]
    hits: array[256, int64]
    lock: Lock
    completed: int

  initLock(lock)

  let perThread = total div threads.int64

  for i in 0 ..< threads:
    contexts[i].id = i
    contexts[i].iterations = perThread
    contexts[i].hits = addr hits[i]
    contexts[i].lock = addr lock
    contexts[i].completed = addr completed
    createThread(threadsArr[i], worker, addr contexts[i])

  # Ждем завершения всех потоков
  while true:
    acquire(lock)
    let done = completed >= threads
    release(lock)
    if done:
      break
    sleep(1)

  for i in 0 ..< threads:
    joinThread(threadsArr[i])

  deinitLock(lock)

  var totalHits: int64 = 0
  for i in 0 ..< threads:
    totalHits += hits[i]

  result = 4.0 * totalHits.float / total.float

proc main() =
  if paramCount() != 2:
    echo "Usage: ", getAppFilename(), " <threads> <total>"
    quit(1)

  let
    threads = paramStr(1).parseInt()
    total = paramStr(2).parseBiggestInt()

  let piEstimate = parallelPi(threads, total)
  echo piEstimate

when isMainModule:
  main()
