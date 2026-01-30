#include <iostream>
#include <fstream>
#include <vector>
#include <thread>
#include <cmath>

void qsort_par(std::vector<double>& a, size_t l, size_t r, int d, int md) {
    while (l < r) {
        double p = a[(l + r) / 2];
        size_t i = l, j = r;
        while (i <= j) {
            while (a[i] < p) ++i;
            while (a[j] > p) --j;
            if (i <= j) std::swap(a[i++], a[j--]);
        }
        if (d < md && i < r) {
            std::thread t(qsort_par, std::ref(a), i, r, d + 1, md);
            r = j;
            t.join();
        } else {
            r = j;
        }
    }
}

int main(int argc, char* argv[]) {
    int mt = std::stoi(argv[1]);
    std::ifstream f(argv[2]);
    std::vector<double> v;
    double x;
    while (f >> x) v.push_back(x);
    
    if (v.size() > 1) {
        int md = mt <= 1 ? 0 : (int)std::log2(mt);
        qsort_par(v, 0, v.size() - 1, 0, md);
    }
    
    std::cout << (v.front() + v.back()) / 2.0 << '\n';
}