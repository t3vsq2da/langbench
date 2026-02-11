use std::env;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let n: usize = env::args().nth(1).unwrap().parse().unwrap();
    let listener = TcpListener::bind("0.0.0.0:8080").unwrap();

    let total = Arc::new(Mutex::new(0i64));
    let count = Arc::new(Mutex::new(0usize));
    let done = Arc::new(Mutex::new(false));

    for stream in listener.incoming() {
        let mut stream = stream.unwrap(); // mutable!
        let total = total.clone();
        let count = count.clone();
        let done = done.clone();
        thread::spawn(move || {
            let mut buf = [0; 1024];
            let _ = stream.peek(&mut buf); // тоже требует mutable, теперь stream mut
            let req = String::from_utf8_lossy(&buf[..]);

            if req.starts_with("POST") {
                let data = extract_number(&req);
                if data != 0 {
                    let mut t = total.lock().unwrap();
                    let mut c = count.lock().unwrap();
                    let mut d = done.lock().unwrap();

                    if !*d {
                        *t += data;
                        *c += 1;

                        if *c >= n {
                            *d = true;
                            let sum = *t;
                            drop((t, c, d)); // освобождаем блокировки перед ответом и exit
                            let _ = stream.write(b"HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nOK");
                            println!("{}", sum);
                            std::process::exit(0);
                        }
                    }
                    drop((t, c, d));
                    let _ = stream.write(b"HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nOK");
                }
            }
        });
    }
}

fn extract_number(body: &str) -> i64 {
    if let Some(pos) = body.find("\"data\":") {
        let after = &body[pos + 7..];
        let mut chars = after.chars().skip_while(|c| c.is_whitespace());
        let sign = if chars.clone().next() == Some('-') {
            chars.next();
            -1
        } else {
            1
        };
        let num: String = chars.take_while(|c| c.is_ascii_digit()).collect();
        num.parse::<i64>().map(|n| sign * n).unwrap_or(0)
    } else {
        0
    }
}