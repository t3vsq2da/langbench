import {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Примитивный LCG
function* lcg(seed) {
  let state = seed;
  const a = 1664525;
  const c = 1013904223;
  const m = 2147483647;
  while (true) {
    state = (a * state + c) % m;
    yield state / m;
  }
}

function runWorker(seed, perThread) {
  const rng = lcg(seed);
  let hits = 0;
  for (let i = 0; i < perThread; i++) {
    const x = rng.next().value;
    const y = rng.next().value;
    if (x * x + y * y <= 1.0) hits++;
  }
  return hits;
}

if (!isMainThread) {
  const { seed, perThread } = workerData;
  const result = runWorker(seed, perThread);
  parentPort.postMessage(result);
} else {
  const threads = parseInt(process.argv[2]);
  const total = parseInt(process.argv[3]);
  const perThread = Math.floor(total / threads);

  const workers = [];
  const results = [];

  // Путь к текущему файлу для воркера
  const workerPath = __filename;

  for (let t = 0; t < threads; t++) {
    const worker = new Worker(workerPath, {
      workerData: { seed: t + 12345, perThread },
    });
    workers.push(worker);
    worker.on("message", hits => {
      results.push(hits);
    });
  }

  Promise.all(
    workers.map(w => new Promise(resolve => w.on("exit", resolve)))
  ).then(() => {
    const totalHits = results.reduce((a, b) => a + b, 0);
    const pi = (4.0 * totalHits) / (perThread * threads);
    console.log(pi);
  });
}
