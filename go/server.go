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

	var data RequestData
	json.NewDecoder(r.Body).Decode(&data)

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

	parsedN, err := strconv.Atoi(os.Args[1])
	n = int32(parsedN)

	// Устанавливаем обработчик
	http.HandleFunc("/", handler)

	// Запускаем сервер
	
	err = http.ListenAndServe(":8080", nil)
	if err != nil {
		os.Exit(1)
	}
}