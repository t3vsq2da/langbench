use std::env;

// Простой линейный конгруэнтный генератор (LCG)
struct Lcg {
    state: u64,
}

impl Lcg {
    fn new(seed: u64) -> Self {
        Self { state: seed }
    }

    fn next_f64(&mut self) -> f64 {
        self.state = self.state.wrapping_mul(1664525).wrapping_add(1013904223);
        (self.state as f64) / (u64::MAX as f64)
    }
}

fn main() {
    let n: u64 = env::args().nth(1).unwrap().parse().unwrap();
    let mut rng = Lcg::new(42);
    let mut inside = 0u64;

    for _ in 0..n {
        let x = rng.next_f64();
        let y = rng.next_f64();
        if x * x + y * y <= 1.0 {
            inside += 1;
        }
    }

    println!("{}", 4.0 * inside as f64 / n as f64);
}