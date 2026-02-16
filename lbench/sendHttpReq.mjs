import http from "http";

const CONCURRENCY = +process.argv[2] || 20;
const RPS_PER_CONN = +process.argv[3] || 20;
const INTERVAL_MS = 1000 / RPS_PER_CONN;

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: CONCURRENCY,
  keepAliveMsecs: 60000,
});

function lcg(state, m = 1337911) {
  return (48271 * state + 1) % m;
}
let toBody = (n) => `{"data":${n}}`;
function startWorker(seed) {
  const sSeed = seed % 20;
  const send = () => {
    const body = toBody(((seed = lcg(seed)), 10));
    const bodyLength = Buffer.byteLength(body);

    const req = http.request(
      {
        host: "127.0.0.1",
        port: 8080,
        method: "POST",
        path: "/",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": bodyLength,
        },
        agent,
      },
      (res) => {
        res.resume();
      },
    );
    req.on("error", () => {});
    req.end(body);
    setTimeout(send, INTERVAL_MS);
  };
  send();
}
let lastsseed = 1161;
for (let i = 0; i < CONCURRENCY; i++) {
  startWorker((lastsseed = lcg(lastsseed, 9999991)));
}
