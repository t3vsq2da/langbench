import sys
import random

n = int(sys.argv[1])
inside = 0

for _ in range(n):
    x = random.random()
    y = random.random()
    if x * x + y * y <= 1.0:
        inside += 1

print(4.0 * inside / n)