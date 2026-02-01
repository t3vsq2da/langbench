import sys
import os

READ_BUFFER_SIZE = 65536
CHUNK_SIZE = 65536

def main():
    file_count = int(sys.argv[1])
    n = int(sys.argv[2])
    
    # Pre-create content with n '1' characters
    content = b'1' * n
    
    # Write phase
    write_files(file_count, content)
    
    # Read phase - read in chunks and count total bytes
    total_bytes = read_files(file_count)
    
    # Count chunks of 65536 bytes
    total_chunks = total_bytes // CHUNK_SIZE
    print(total_chunks)
    
    # Cleanup
    cleanup_files(file_count)

def write_files(file_count, content):
    for i in range(file_count):
        filename = f"file{i}"
        with open(filename, 'wb') as f:
            f.write(content)

def read_files(file_count):
    total_bytes = 0
    buffer = bytearray(READ_BUFFER_SIZE)
    
    for i in range(file_count):
        filename = f"file{i}"
        with open(filename, 'rb') as f:
            while True:
                bytes_read = f.readinto(buffer)
                if bytes_read == 0:
                    break
                total_bytes += bytes_read
    
    return total_bytes

def cleanup_files(file_count):
    for i in range(file_count):
        filename = f"file{i}"
        os.remove(filename)

if __name__ == "__main__":
    main()