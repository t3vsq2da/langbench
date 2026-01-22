defmodule Main do
  def main() do
    n = System.argv() |> List.first() |> String.to_integer()
    IO.puts(fib(n))
  end

  def fib(0), do: 0
  def fib(1), do: 1
  def fib(n), do: fib(n - 1) + fib(n - 2)
end
