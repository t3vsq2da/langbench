import sys
import multiprocessing as mp
from multiprocessing import Pool

def worker(args):
    thread_id, per_thread = args
    seed = thread_id + 12345
    hits = 0
    a = 1664525
    c = 1013904223
    m = 2147483647
    for _ in range(per_thread):
        seed = (a * seed + c) & 0x7fffffff
        x = seed / m
        seed = (a * seed + c) & 0x7fffffff
        y = seed / m
        if x * x + y * y <= 1.0:
            hits += 1
    return hits

if __name__ == "__main__":
    # Только на Linux!
    mp.set_start_method('fork')

    threads = int(sys.argv[1])
    total = int(sys.argv[2])
    per_thread = total // threads

    with Pool(processes=threads) as pool:
        results = pool.map(worker, [(t, per_thread) for t in range(threads)])

    total_hits = sum(results)
    pi = 4.0 * total_hits / (per_thread * threads)
    print(pi)