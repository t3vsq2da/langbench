#include <vector>
#include <thread>
#include <cmath>
#include <cstring>
#include <iostream>

void simple_sieve(int limit, std::vector<int>& primes) {
    std::vector<char> is_prime(limit + 1, 1);
    is_prime[0] = is_prime[1] = 0;
    for (int i = 2; i * i <= limit; ++i)
        if (is_prime[i])
            for (int j = i * i; j <= limit; j += i)
                is_prime[j] = 0;
    for (int i = 2; i <= limit; ++i)
        if (is_prime[i])
            primes.push_back(i);
}

size_t count_segment(int low, int high, const std::vector<int>& primes) {
    int size = high - low + 1;
    std::vector<char> is_prime(size, 1);
    for (int p : primes) {
        int start = ((low + p - 1) / p) * p;
        if (start < p * p) start = p * p;
        for (int j = start; j <= high; j += p)
            is_prime[j - low] = 0;
    }
    if (low == 1) is_prime[0] = 0;
    size_t cnt = 0;
    for (int i = 0; i < size; ++i)
        cnt += is_prime[i];
    return cnt;
}

int main(int argc, char* argv[]) {
    int threads = std::stoi(argv[1]);
    int n = std::stoi(argv[2]);
    
    int limit = std::sqrt(n);
    std::vector<int> primes;
    simple_sieve(limit, primes);
    
    size_t total = primes.size();
    if (limit >= n) {
        std::cout << total << '\n';
        return 0;
    }
    
    int segment_size = 32768;
    std::vector<std::thread> pool;
    std::vector<size_t> results(threads, 0);
    
    for (int t = 0; t < threads; ++t) {
        pool.emplace_back([&, t]() {
            int start = limit + 1 + t * segment_size;
            for (int low = start; low <= n; low += threads * segment_size) {
                int high = std::min(low + segment_size - 1, n);
                results[t] += count_segment(low, high, primes);
            }
        });
    }
    
    for (auto& th : pool) th.join();
    for (size_t r : results) total += r;
    
    std::cout << total << '\n';
}