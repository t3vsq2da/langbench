#include <random>
#include <iostream>

int main(int argc, char* argv[]) {
    long long n = std::stoll(argv[1]);
    std::mt19937_64 rng(42);
    std::uniform_real_distribution<double> d(0.0, 1.0);

    long long inside = 0;
    for (long long i = 0; i < n; ++i) {
        double x = d(rng);
        double y = d(rng);
        if (x * x + y * y <= 1.0) inside++;
    }

    std::cout << 4.0 * inside / n << '\n';
}