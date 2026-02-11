import os, net, threadpool, locks, parseutils, strutils

var n: int
discard parseInt(paramStr(1), n)

{.passL: "-lc".}  # для exit()

proc c_exit(code: cint) {.importc: "exit", header: "<stdlib.h>".}

var totalSum = 0
var requestCount = 0
var lock: Lock
initLock(lock)
var shouldExit = false
var server: Socket;

proc handleClient(client: Socket) {.thread.} =
  defer: client.close()

  discard client.recvLine()  # строка запроса

  var contentLength = 0
  while true:
    let line = client.recvLine()
    if line.strip() == "":
      break
    # Приводим к нижнему регистру для сравнения
    if line.toLower().startsWith("content-length"):
      let parts = line.split(':')
      if parts.len > 1:
        discard parseInt(parts[1].strip(), contentLength)

  # Если Content-Length не указан — выходим (но у вас он всегда есть)
  if contentLength <= 0:
    return

  # Читаем ровно contentLength байт
  var body = ""
  var remaining = contentLength
  while remaining > 0:
    let toRead = min(remaining, 1024)
    let chunk = client.recv(toRead)
    if chunk.len == 0:
      break
    body.add(chunk)
    dec remaining, chunk.len
  
  var data = 0
  var i = 0
  while i <= body.len - 6:
    if body[i..i+5] == "\"data\"":
      var j = i + 6
      while j < body.len and (body[j] in Whitespace or body[j] == ':'):
        inc j
      var neg = false
      if j < body.len and body[j] == '-':
        neg = true
        inc j
      var num = 0
      while j < body.len and body[j] in {'0'..'9'}:
        num = num * 10 + (body[j].int - '0'.int)
        inc j
      data = if neg: -num else: num
      break
    inc i

  var doExit = false
  withLock lock:
    if not shouldExit:
      totalSum += data
      inc requestCount
      if requestCount >= n:
        shouldExit = true
        doExit = true

  if doExit:
    echo totalSum
    c_exit(0)

  client.send("HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nOK")

proc main =
  server = newSocket()
  server.setSockOpt(OptReuseAddr, true)  # ← ЭТА СТРОКА РЕШАЕТ ПРОБЛЕМУ
  server.bindAddr(Port(8080), "0.0.0.0")
  server.listen()
  while true:
    var client: Socket
    server.accept(client)
    spawn handleClient(client)

main()