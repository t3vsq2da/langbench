package main

import (
	"os"
	"strconv"
)

const (
	readBufferSize = 65536
	chunkSize      = 65536
)

func main() {
	fileCount := atoi(os.Args[1])
	n := atoi(os.Args[2])

	// Pre-create content with n '1' characters
	content := make([]byte, n)
	for i := range content {
		content[i] = '1'
	}

	// Write phase
	for i := 0; i < fileCount; i++ {
		filename := "file" + itoa(i)
		file, _ := os.Create(filename)
		file.Write(content)
		file.Close()
	}

	// Read phase - read in chunks and count total bytes
	totalBytes := uint64(0)
	buffer := make([]byte, readBufferSize)

	for i := 0; i < fileCount; i++ {
		filename := "file" + itoa(i)
		file, _ := os.Open(filename)

		for {
			bytesRead, _ := file.Read(buffer)
			if bytesRead == 0 {
				break
			}

			totalBytes += uint64(bytesRead)
		}

		file.Close()
	}

	// Count chunks of 65536 bytes
	totalChunks := totalBytes / chunkSize
	writeUint64(totalChunks)

	// Cleanup
	for i := 0; i < fileCount; i++ {
		filename := "file" + itoa(i)
		os.Remove(filename)
	}
}

// Simple atoi without error checking for benchmark
func atoi(s string) int {
	result := 0

	for _, c := range s {
		result = result*10 + int(c-'0')
	}

	return result
}

// Simple itoa without error checking for benchmark
func itoa(n int) string {
	if n == 0 {
		return "0"
	}

	var digits [20]byte // достаточно для int64 (19 цифр + знак)
	i := len(digits)

	for n > 0 {
		i--
		digits[i] = byte('0' + n%10)
		n /= 10
	}

	return string(digits[i:])
}

func writeUint64(n uint64) {
	var buf [20]byte
	b := strconv.AppendUint(buf[:0], n, 10)
	os.Stdout.Write(b)
}
