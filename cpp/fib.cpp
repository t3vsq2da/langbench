#include <iostream>
#include <cstdlib>

int fib(int n) {
    return n <= 1?n:fib(n - 1) + fib(n - 2);
}

int main(int argc, char* argv[]) {
    int n = std::atoi(argv[1]);
    std::cout<<fib(n);
    return 0;
}
