package main

import (
	"math/rand"
	"os"
	"strconv"
)

func main() {
	n := atoi(os.Args[1])

	inside := 0
	for i := 0; i < n; i++ {
		x := rand.Float64()
		y := rand.Float64()
		if x*x+y*y <= 1.0 {
			inside++
		}
	}

	writeFloat64(4.0 * float64(inside) / float64(n))
}

func atoi(s string) int {
	result := 0

	for _, c := range s {
		result = result*10 + int(c-'0')
	}

	return result
}

func writeFloat64(n float64) {
	var buf [64]byte
	b := strconv.AppendFloat(buf[:0], n, 'f', -1, 64)
	os.Stdout.Write(b)
}
