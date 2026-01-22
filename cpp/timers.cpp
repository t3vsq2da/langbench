#include <boost/asio.hpp>
#include <boost/asio/steady_timer.hpp>
#include <iostream>
#include <memory>
#include <random>
#include <chrono>

int main(int argc, char* argv[]) {
    int timer_count = (argc > 1) ? std::atoi(argv[1]) : 100000;
    
    boost::asio::io_context io_ctx;
    std::atomic<int> completed_count{0};
    
    // Initialize random number generator
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(1, 1000);
    
    auto start_time = std::chrono::high_resolution_clock::now();
    
    // Create all async timers
    for (int i = 0; i < timer_count; ++i) {
        auto timer = std::make_shared<boost::asio::steady_timer>(io_ctx);
        auto duration = std::chrono::milliseconds(dis(gen));
        
        timer->expires_after(duration);
        timer->async_wait([&completed_count, timer](const boost::system::error_code& ec) {
            if (!ec) {
                completed_count++;
            }
            // Timer keeps itself alive via shared_ptr capture
        });
    }
    
    // Run all timers concurrently
    io_ctx.run();
    
    auto end_time = std::chrono::high_resolution_clock::now();
    auto elapsed_ms = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time).count();
    
    std::cout << "Completed " << completed_count.load() << " timers in " << elapsed_ms << " ms" << std::endl;
    
    return 0;
}