use std::env;
use std::thread;

// Генерация следующего "случайного" f64 из состояния
#[inline(always)]
fn next_f64(state: &mut u64) -> f64 {
    *state = state.wrapping_add(1);
    let x = *state ^ (*state >> 32);
    (x as f64) / (u64::MAX as f64)
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let threads: usize = args[1].parse().unwrap();
    let total: usize = args[2].parse().unwrap();

    let per_thread = total / threads;
    let mut handles = vec![];

    for t in 0..threads {
        let handle = thread::spawn(move || {
            let mut state = t as u64 + 12345; // уникальный seed
            let mut hits = 0;
            for _ in 0..per_thread {
                let x = next_f64(&mut state);
                let y = next_f64(&mut state);
                if x * x + y * y <= 1.0 {
                    hits += 1;
                }
            }
            hits
        });
        handles.push(handle);
    }

    let total_hits: usize = handles.into_iter().map(|h| h.join().unwrap()).sum();
    let pi = 4.0 * (total_hits as f64) / ((per_thread * threads) as f64);
    println!("{}", pi);
}