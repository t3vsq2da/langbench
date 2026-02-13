#include <iostream>
#include <thread>
#include <atomic>
#include <mutex>
#include <string>
#include <cstring>
#include <cstdlib>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <sstream>
#include <regex>

std::atomic<long long> total_sum{0};
std::atomic<int> request_count{0};
int target_n = 0;
std::mutex shutdown_mutex;

long long extract_data_value(const char* body) {
    const char* p = std::strstr(body, "\"data\":");
    if (!p) return 0;
    p += 7; // skip "\"data\":"
    while (*p == ' ' || *p == '\t') ++p;
    return std::atoll(p);
}

void handle_client(int client_sock) {
    char buffer[4096];
    ssize_t n = recv(client_sock, buffer, sizeof(buffer) - 1, 0);
    if (n <= 0) {
        close(client_sock);
        return;
    }
    buffer[n] = '\0';

    // Находим начало тела (пропускаем заголовки)
    char* body = std::strstr(buffer, "\r\n\r\n");
    if (!body) {
        close(client_sock);
        return;
    }
    body += 4;

    long long data = extract_data_value(body);

    long long sum = total_sum.fetch_add(data) + data;
    int cnt = request_count.fetch_add(1) + 1;

    const char* resp = "HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nOK";
    send(client_sock, resp, strlen(resp), 0);
    close(client_sock);

    if (cnt >= target_n) {
        std::lock_guard<std::mutex> lock(shutdown_mutex);
        static bool exited = false;
        if (!exited) {
            std::cout << sum << std::endl;
            exited = true;
            exit(0);
        }
    }
}

int main(int argc, char* argv[]) {
    target_n = std::atoi(argv[1]);

    int server_sock = socket(AF_INET, SOCK_STREAM, 0);
    int opt = 1;
    setsockopt(server_sock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_port = htons(8080);
    bind(server_sock, (struct sockaddr*)&addr, sizeof(addr));
    listen(server_sock, 128);

    while (true) {
        int client_sock = accept(server_sock, nullptr, nullptr);
        std::thread(handle_client, client_sock).detach();
    }
}