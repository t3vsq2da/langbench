import sys
f = lambda n: n if n < 2 else f(n-1) + f(n-2)
print(f(int(sys.argv[1])))
