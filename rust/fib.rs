use std::env;

fn fib(n: i32) -> i32 {
    if n <= 1 { n } else { fib(n - 1) + fib(n - 2) }
}

fn main() {
    let n: i32 = env::args().nth(1).unwrap().parse().unwrap();
    println!("{}", fib(n));
}
