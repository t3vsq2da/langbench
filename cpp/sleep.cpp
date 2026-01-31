#include <string>
#include <time.h>

int main(int argc, char* argv[]) {
    long ms = atol(argv[1]);
    struct timespec start, now;
    clock_gettime(CLOCK_MONOTONIC, &start);
    do clock_gettime(CLOCK_MONOTONIC, &now);
    while ((now.tv_sec - start.tv_sec) * 1000 + (now.tv_nsec - start.tv_nsec) / 1000000 < ms);
}