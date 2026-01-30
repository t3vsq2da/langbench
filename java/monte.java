import java.util.Random;

public class monte {
    public static void main(String[] args) {
        if (args.length < 1) {
            System.err.println("Usage: java MonteCarloPi <iterations>");
            System.exit(1);
        }

        long n = Long.parseLong(args[0]);
        Random rng = new Random(42);  // LCG с фиксированным seed (аналог mt19937_64 по семантике использования)

        long inside = 0;
        for (long i = 0; i < n; i++) {
            double x = rng.nextDouble();  // [0.0, 1.0)
            double y = rng.nextDouble();  // [0.0, 1.0)
            if (x * x + y * y <= 1.0) {
                inside++;
            }
        }

        System.out.println(4.0 * inside / n);
    }
}