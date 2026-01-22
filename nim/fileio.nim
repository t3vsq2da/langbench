import os, strutils

const
  ReadBufferSize = 65536
  ChunkSize = 65536

proc main() =
  let fileCount = paramStr(1).parseInt()
  let n = paramStr(2).parseInt()

  # Pre-create content with n '1' characters
  var content = newString(n)
  for i in 0..<n:
    content[i] = '1'

  # Write phase
  for i in 0..<fileCount:
    let filename = "file" & $i
    writeFile(filename, content)

  # Read phase - read in chunks and count total bytes
  var totalBytes: uint64 = 0
  var buffer = newString(ReadBufferSize)

  for i in 0..<fileCount:
    let filename = "file" & $i
    let file = open(filename, fmRead)

    while true:
      let bytesRead = file.readBuffer(addr buffer[0], ReadBufferSize)
      if bytesRead == 0:
        break
      totalBytes += uint64(bytesRead)

    file.close()

  # Count chunks of 65536 bytes
  let totalChunks = totalBytes div ChunkSize
  echo totalChunks

  # Cleanup
  for i in 0..<fileCount:
    let filename = "file" & $i
    removeFile(filename)

main()
