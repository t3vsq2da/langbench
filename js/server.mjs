import http from "node:http";
import cluster from "node:cluster";
import os from "node:os";
const numCPUs = os.cpus().length;

const n = parseInt(process.argv[2], 10);

if (cluster.isMaster) {
  let totalSum = 0;
  let requestCount = 0;

  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();

    worker.on("message", (msg) => {
      if (msg.type === "request") {
        totalSum += msg.data;
        requestCount++;

        if (requestCount >= n) {
          console.log(totalSum);
          // Убиваем всех воркеров
          for (const id in cluster.workers) {
            cluster.workers[id].kill();
          }
          process.exit(0);
        }
      }
    });
  }
} else {
  // Воркер: создаём HTTP-сервер
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const data = JSON.parse(body).data;

      // Отправляем ответ
      res.writeHead(200, {
        "Content-Length": 2,
        Connection: "close",
      });
      res.end("OK");

      // Сообщаем мастеру о запросе
      process.send({ type: "request", data: data });
    });
  });

  server.listen(8080);
}
