defmodule TimersBenchmark do
  def run(timer_count) do
    parent = self()
    
    # Start all timers
    start_time = System.monotonic_time(:millisecond)
    
    for _ <- 1..timer_count do
      spawn(fn -> 
        :timer.sleep(:rand.uniform(1000))
        send(parent, :done)
      end)
    end
    
    # Wait for all completions
    wait_for_completions(timer_count)
    
    end_time = System.monotonic_time(:millisecond)
    elapsed = end_time - start_time
    
    IO.puts("Completed #{timer_count} timers in #{elapsed} ms")
  end
  
  defp wait_for_completions(0), do: :ok
  
  defp wait_for_completions(count) do
    receive do
      :done -> wait_for_completions(count - 1)
    end
  end
end

# Get timer count from command line or default to 100000
timer_count = 
  case System.argv() do
    [count_str] -> String.to_integer(count_str)
    [] -> 100_000
  end

TimersBenchmark.run(timer_count)
