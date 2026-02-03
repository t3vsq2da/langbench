package main

import (
	"fmt"
	"math/rand"
	"os"
	"strconv"
	"sync"
)

func main() {
	threads, _ := strconv.Atoi(os.Args[1])
	total, _ := strconv.Atoi(os.Args[2])

	perThread := total / threads
	var wg sync.WaitGroup
	results := make([]int64, threads)

	for t := 0; t < threads; t++ {
		wg.Add(1)
		go func(threadID int) {
			defer wg.Done()
			// Уникальный seed для каждой горутины
			r := rand.New(rand.NewSource(int64(threadID)))
			hits := int64(0)
			for i := 0; i < perThread; i++ {
				x := r.Float64()
				y := r.Float64()
				if x*x+y*y <= 1.0 {
					hits++
				}
			}
			results[threadID] = hits
		}(t)
	}

	wg.Wait()

	totalHits := int64(0)
	for _, h := range results {
		totalHits += h
	}

	pi := 4.0 * float64(totalHits) / float64(perThread*threads)
	fmt.Println(pi)
}