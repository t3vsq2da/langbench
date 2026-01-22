// file_io.js
import fs from 'node:fs'
import {argv} from 'node:process'

const READ_BUFFER_SIZE = 65536;
const CHUNK_SIZE = 65536;

const fileCount = Number(argv[2]);
const n = Number(argv[3]);

// Pre-create content with n '1' characters
const content = Buffer.alloc(n, '1');

// Write phase
for (let i = 0; i < fileCount; i++) {
  const filename = `file${i}`;
  fs.writeFileSync(filename, content);
}

// Read phase - read in chunks and count total bytes
let totalBytes = 0;
const buffer = Buffer.alloc(READ_BUFFER_SIZE);

for (let i = 0; i < fileCount; i++) {
  const filename = `file${i}`;
  const fd = fs.openSync(filename, 'r');
  
  let bytesRead;
  while ((bytesRead = fs.readSync(fd, buffer, 0, READ_BUFFER_SIZE, null)) > 0) {
    totalBytes += bytesRead;
  }
  
  fs.closeSync(fd);
}

// Count chunks of 65536 bytes
const totalChunks = Math.floor(totalBytes / CHUNK_SIZE);
console.log(totalChunks);

// Cleanup
for (let i = 0; i < fileCount; i++) {
  const filename = `file${i}`;
  fs.unlinkSync(filename);
}