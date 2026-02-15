import http from "http";

const CONCURRENCY = +process.argv[2] || 10;
const RPS_PER_CONN = +process.argv[3] || 10;
const INTERVAL_MS = 1000 / RPS_PER_CONN;

const body = '{"data":10}';
const bodyLength = Buffer.byteLength(body); // ← точная длина в байтах

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: CONCURRENCY,
  keepAliveMsecs: 60000,
});

function startWorker() {
  const send = () => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port: 8080,
        method: "POST",
        path: "/",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": bodyLength, // ← явно задаём!
        },
        agent,
      },
      (res) => {
        res.resume();
      },
    );
    req.on("error", () => {});
    req.end(body); // ← сразу end(), без write()
    setTimeout(send, INTERVAL_MS);
  };
  send();
}

for (let i = 0; i < CONCURRENCY; i++) startWorker();
