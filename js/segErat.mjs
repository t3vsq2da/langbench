// prime-sieve.js
import {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} from "node:worker_threads";
import { cpus } from "node:os";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);

function simpleSieve(limit) {
  const isPrime = new Uint8Array(limit + 1).fill(1);
  isPrime[0] = isPrime[1] = 0;
  for (let i = 2; i * i <= limit; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j <= limit; j += i) {
        isPrime[j] = 0;
      }
    }
  }
  const primes = [];
  for (let i = 2; i <= limit; i++) {
    if (isPrime[i]) primes.push(i);
  }
  return primes;
}

function countSegment(low, high, primes) {
  const size = high - low + 1;
  const isPrime = new Uint8Array(size).fill(1);
  for (const p of primes) {
    let start = Math.ceil(low / p) * p;
    if (start < p * p) start = p * p;
    for (let j = start; j <= high; j += p) {
      isPrime[j - low] = 0;
    }
  }
  if (low === 1) isPrime[0] = 0;
  let cnt = 0;
  for (let i = 0; i < size; i++) cnt += isPrime[i];
  return cnt;
}

// ---------- Worker code ----------
if (!isMainThread) {
  const { threadId, n, limit, segmentSize, primes } = workerData;
  let total = 0;
  let start = limit + 1 + threadId * segmentSize;
  for (let low = start; low <= n; low += cpus().length * segmentSize) {
    const high = Math.min(low + segmentSize - 1, n);
    total += countSegment(low, high, primes);
  }
  parentPort.postMessage(total);
}

// ---------- Main thread ----------
if (isMainThread) {
  if (process.argv.length < 4) {
    console.error("Usage: node prime-sieve.js <threads> <n>");
    process.exit(1);
  }

  const threads = parseInt(process.argv[2]);
  const n = parseInt(process.argv[3]);

  const limit = Math.floor(Math.sqrt(n));
  const primes = simpleSieve(limit);

  let total = primes.length;
  if (limit >= n) {
    console.log(total);
    process.exit(0);
  }

  const segmentSize = 32768;
  const workers = [];
  const results = [];

  for (let t = 0; t < threads; t++) {
    const worker = new Worker(__filename, {
      workerData: { threadId: t, n, limit, segmentSize, primes },
    });
    workers.push(worker);
    results.push(new Promise(resolve => worker.on("message", resolve)));
  }

  Promise.all(results).then(counts => {
    const sum = counts.reduce((a, b) => a + b, 0);
    console.log(total + sum);
    process.exit(0);
  });
}
