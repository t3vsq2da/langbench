defmodule Main do
  def main() do
    [threads_str, total_str] = System.argv()
    threads = String.to_integer(threads_str)
    total = String.to_integer(total_str)

    per_thread = div(total, threads)

    results =
      Task.async_stream(
        0..(threads - 1),
        fn seed ->
          :rand.seed(:exsplus, {seed, seed + 1, seed + 2})
          hits =
            Stream.repeatedly(fn ->
              x = :rand.uniform()
              y = :rand.uniform()
              x * x + y * y <= 1.0
            end)
            |> Stream.take(per_thread)
            |> Enum.count(& &1)
          hits
        end,
        timeout: :infinity,
        max_concurrency: threads
      )
      |> Enum.map(fn {:ok, res} -> res end)

    total_hits = Enum.sum(results)
    pi_estimate = 4.0 * total_hits / (per_thread * threads)
    IO.puts(pi_estimate)
  end
end
