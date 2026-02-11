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
std::mutex shutdown_mutex; // Защищает завершение

long long extract_data_value(const std::string& body) {
    std::regex pattern(R"(\{\"data\":(\d+)\})");
    std::smatch matches;
    if (std::regex_search(body, matches, pattern) && matches.size() == 2) {
        return std::stoll(matches[1].str());
    }
    return 0;
}

void handle_client(int client_sock) {
    char buffer[4096];
    ssize_t bytes_read = recv(client_sock, buffer, sizeof(buffer) - 1, 0);
    if (bytes_read <= 0) {
        close(client_sock);
        return;
    }
    buffer[bytes_read] = '\0';
    std::string request(buffer);

    if (request.find("POST / ") == std::string::npos) {
        const char* response = "HTTP/1.1 405 Method Not Allowed\r\nConnection: close\r\n\r\n";
        send(client_sock, response, strlen(response), 0);
        close(client_sock);
        return;
    }

    size_t body_pos = request.find("\r\n\r\n");
    if (body_pos == std::string::npos) {
        const char* response = "HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n";
        send(client_sock, response, strlen(response), 0);
        close(client_sock);
        return;
    }
    std::string body = request.substr(body_pos + 4);

    long long data = extract_data_value(body);

    long long current_sum = total_sum.fetch_add(data) + data;
    int current_count = request_count.fetch_add(1) + 1;

    const char* ok_response = "HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nOK";
    send(client_sock, ok_response, strlen(ok_response), 0);
    close(client_sock);

    // КРИТИЧЕСКАЯ СЕКЦИЯ: только один поток может завершить программу
    if (current_count >= target_n) {
        std::lock_guard<std::mutex> lock(shutdown_mutex);
        // Повторная проверка на случай, если другой поток уже завершил
        static bool already_exited = false;
        if (!already_exited) {
            std::cout << current_sum << std::endl;
            already_exited = true;
            exit(0);
        }
    }
}

int main(int argc, char* argv[]) {
    if (argc != 2) {
        std::cerr << "Usage: " << argv[0] << " <n>" << std::endl;
        return 1;
    }

    target_n = std::atoi(argv[1]);

    int server_sock = socket(AF_INET, SOCK_STREAM, 0);
    if (server_sock < 0) {
        perror("socket");
        return 1;
    }

    int opt = 1;
    setsockopt(server_sock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(8080);

    if (bind(server_sock, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        perror("bind");
        close(server_sock);
        return 1;
    }

    if (listen(server_sock, 128) < 0) {
        perror("listen");
        close(server_sock);
        return 1;
    }

    while (true) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);
        int client_sock = accept(server_sock, (struct sockaddr*)&client_addr, &client_len);
        if (client_sock < 0) {
            perror("accept");
            continue;
        }

        std::thread(handle_client, client_sock).detach();
    }

    close(server_sock);
    return 0;
}