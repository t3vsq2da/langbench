#include <fstream>
#include <iostream>
#include <string>
#include <cstdlib>
#include <vector>

int main(int argc, char* argv[]) {
    const int fileCount = std::atoi(argv[1]);
    const int n = std::atoi(argv[2]);

    // Pre-allocate buffer with n '1' characters
    std::vector<char> write_buffer(n, '1');

    // Write phase - write entire buffer at once
    for (int i = 0; i < fileCount; ++i) {
        std::string filename = "file" + std::to_string(i);
        std::ofstream file(filename, std::ios::binary);
        file.write(write_buffer.data(), n);
        file.close();
    }

    // Read phase - read in chunks and count total bytes
    long long total_bytes = 0;
    const size_t READ_BUFFER_SIZE = 65536; // 64 KiB read buffer
    std::vector<char> read_buffer(READ_BUFFER_SIZE);
    
    for (int i = 0; i < fileCount; ++i) {
        std::string filename = "file" + std::to_string(i);
        std::ifstream file(filename, std::ios::binary);
        
        size_t bytes_read;
        while (file.read(read_buffer.data(), READ_BUFFER_SIZE) || 
               (bytes_read = file.gcount()) > 0) {
            if (file.gcount() > 0) {
                total_bytes += file.gcount();
            }
        }
        file.close();
    }

    // Count chunks of 65536 bytes
    const long long CHUNK_SIZE = 65536;
    const long long total_chunks = total_bytes / CHUNK_SIZE;
    std::cout << total_chunks << '\n';

    // Cleanup
    for (int i = 0; i < fileCount; ++i) {
        std::string filename = "file" + std::to_string(i);
        std::remove(filename.c_str());
    }

    return 0;
}