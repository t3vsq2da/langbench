import http from "node:http";
import cluster from "node:cluster";
import os from "node:os";
const numCPUs = os.cpus().length;

// Получаем n из аргументов
const n = parseInt(process.argv[2], 10);

if (!n || n <= 0) {
  console.error("Usage: node server.js <n>");
  process.exit(1);
}

// Если мы в главном процессе — форкаем воркеры
if (cluster.isMaster) {
  // Создаём общий счётчик через shared memory (используем файловый дескриптор или IPC)
  let totalSum = 0;
  let requestCount = 0;

  // Запускаем один воркер на ядро
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();

    // Слушаем сообщения от воркеров
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
    if (req.method !== "POST" || req.url !== "/") {
      res.writeHead(405, { "Content-Length": 0 });
      res.end();
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body).data;

        // Отправляем ответ
        res.writeHead(200, {
          "Content-Length": 2,
          Connection: "close",
        });
        res.end("OK");

        // Сообщаем мастеру о запросе
        process.send({ type: "request", data: data });
      } catch (err) {
        res.writeHead(400, { "Content-Length": 0 });
        res.end();
      }
    });
  });

  server.listen(8080);
}
