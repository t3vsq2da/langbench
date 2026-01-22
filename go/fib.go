package main

import (
	"os"
	"strconv"
)

func fib(n int) int {
	if n <= 1 {
		return n
	}

	return fib(n-1) + fib(n-2)
}

func main() {
	writeInt(fib(atoi(os.Args[1])))
}

func atoi(s string) int {
	result := 0

	for _, c := range s {
		result = result*10 + int(c-'0')
	}

	return result
}

func writeInt(n int) {
	var buf [20]byte
	b := strconv.AppendInt(buf[:0], int64(n), 10)
	os.Stdout.Write(b)
}
