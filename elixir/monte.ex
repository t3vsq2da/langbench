defmodule Main do
  def main() do
    n = System.argv() |> List.first() |> String.to_integer()

    inside =
      1..n
      |> Enum.reduce(0, fn _, acc ->
        x = :rand.uniform()
        y = :rand.uniform()
        if x * x + y * y <= 1, do: acc + 1, else: acc
      end)

    IO.puts(4.0 * inside / n)
  end
end
