use std::env;
use std::fs::{File, remove_file};
use std::io::{Read, Write};

const READ_BUFFER_SIZE: usize = 65536;
const CHUNK_SIZE: u64 = 65536;

fn main() {
    let args: Vec<String> = env::args().collect();
    let file_count: usize = args[1].parse().unwrap();
    let n: usize = args[2].parse().unwrap();

    // Pre-create content with n '1' characters
    let content = vec![b'1'; n];

    // Write phase
    write_files(file_count, &content);

    // Read phase - read in chunks and count total bytes
    let total_bytes = read_files(file_count);

    // Count chunks of 65536 bytes
    let total_chunks = total_bytes / CHUNK_SIZE;
    println!("{}", total_chunks);

    // Cleanup
    cleanup_files(file_count);
}

fn write_files(file_count: usize, content: &[u8]) {
    for i in 0..file_count {
        let filename = format!("file{}", i);
        let mut file = File::create(filename).unwrap();
        file.write_all(content).unwrap();
    }
}

fn read_files(file_count: usize) -> u64 {
    let mut total_bytes: u64 = 0;
    let mut buffer = vec![0u8; READ_BUFFER_SIZE];
    
    for i in 0..file_count {
        let filename = format!("file{}", i);
        let mut file = File::open(filename).unwrap();
        
        loop {
            match file.read(&mut buffer) {
                Ok(0) => break, // EOF
                Ok(bytes_read) => {
                    total_bytes += bytes_read as u64;
                }
                Err(_) => break,
            }
        }
    }
    total_bytes
}

fn cleanup_files(file_count: usize) {
    for i in 0..file_count {
        let filename = format!("file{}", i);
        let _ = remove_file(filename);
    }
}