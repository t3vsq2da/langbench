package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"sync"
	"sync/atomic"
)

type RequestData struct {
	Data int `json:"data"`
}

var (
	totalSum     int64
	requestCount int32
	n            int32
	wg           sync.WaitGroup
	once         sync.Once
)

func handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var data RequestData
	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	// Атомарно увеличиваем сумму и счетчик
	atomic.AddInt64(&totalSum, int64(data.Data))
	newCount := atomic.AddInt32(&requestCount, 1)

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
	//fmt.Println()

	// Проверяем, достигли ли нужного количества запросов
	if newCount >= n {
		once.Do(func() {
			fmt.Println(totalSum)
			os.Exit(0)
		})
	}
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: ./server <n>")
		os.Exit(1)
	}

	parsedN, err := strconv.Atoi(os.Args[1])
	if err != nil {
		fmt.Printf("Invalid number: %v\n", err)
		os.Exit(1)
	}
	n = int32(parsedN)

	// Устанавливаем обработчик
	http.HandleFunc("/", handler)

	// Запускаем сервер
	
	err = http.ListenAndServe(":8080", nil)
	if err != nil {
		fmt.Printf("Server error: %v\n", err)
		os.Exit(1)
	}
}