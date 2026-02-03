#include <thread>
#include <vector>
#include <random>
#include <iostream>

int main(int argc, char* argv[]) {
    int threads = std::stoi(argv[1]);
    long long total = std::stoll(argv[2]);

    std::vector<std::thread> pool;
    std::vector<long long> hits(threads, 0);

    for (int t = 0; t < threads; ++t) {
        pool.emplace_back([&, t]() {
            std::mt19937_64 gen(t); // разные seed'ы
            std::uniform_real_distribution<double> dis(0.0, 1.0);
            long long local_hits = 0;
            long long per_thread = total / threads;
            for (long long i = 0; i < per_thread; ++i) {
                double x = dis(gen);
                double y = dis(gen);
                if (x*x + y*y <= 1.0) local_hits++;
            }
            hits[t] = local_hits;
        });
    }

    for (auto& th : pool) th.join();
    long long total_hits = 0;
    for (auto h : hits) total_hits += h;
    double pi = 4.0 * total_hits / (total / threads * threads);
    std::cout << pi << '\n';
}