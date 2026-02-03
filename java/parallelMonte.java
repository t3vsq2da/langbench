import java.util.concurrent.*;

public class parallelMonte {

    // Примитивный LCG (Linear Congruential Generator)
    static class LCG {
        private long state;
        private static final long A = 1664525L;
        private static final long C = 1013904223L;
        private static final long M = (1L << 31) - 1;

        public LCG(long seed) {
            this.state = seed;
        }

        public double nextDouble() {
            state = (A * state + C) % M;
            return (double) state / M;
        }
    }

    static long worker(int seed, int perThread) {
        LCG rng = new LCG(seed);
        long hits = 0;
        for (int i = 0; i < perThread; i++) {
            double x = rng.nextDouble();
            double y = rng.nextDouble();
            if (x * x + y * y <= 1.0) {
                hits++;
            }
        }
        return hits;
    }

    public static void main(String[] args) throws InterruptedException, ExecutionException {
        int threads = Integer.parseInt(args[0]);
        int total = Integer.parseInt(args[1]);
        int perThread = total / threads;

        ExecutorService executor = Executors.newFixedThreadPool(threads);
        Future<Long>[] futures = new Future[threads];

        for (int t = 0; t < threads; t++) {
            final int threadId = t;
            futures[t] = executor.submit(() -> worker(threadId + 12345, perThread));
        }

        long totalHits = 0;
        for (int t = 0; t < threads; t++) {
            totalHits += futures[t].get();
        }

        executor.shutdown();

        double pi = 4.0 * totalHits / (perThread * threads);
        System.out.println(pi);
    }
}