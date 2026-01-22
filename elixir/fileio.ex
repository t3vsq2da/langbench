defmodule Main do
  @read_chunk_size 65536  # 64 KiB read buffer
  @chunk_size 65536       # chunk size for counting

  def main() do
    [file_count_str, n_str] = System.argv()
    file_count = String.to_integer(file_count_str)
    n = String.to_integer(n_str)

    # Pre-create content string with n '1' characters
    content = :binary.copy("1", n)

    # Write phase - write entire content at once
    write_files(file_count, content)

    # Read phase - read in chunks and count total bytes
    total_bytes = read_files(file_count)

    # Count chunks of 65536 bytes
    total_chunks = div(total_bytes, @chunk_size)
    IO.puts(total_chunks)

    # Cleanup
    cleanup_files(file_count)
  end

  defp write_files(file_count, content) do
    for i <- 0..(file_count - 1) do
      filename = "file#{i}"
      File.write!(filename, content)
    end
  end

  defp read_files(file_count) do
    Enum.reduce(0..(file_count - 1), 0, fn i, acc ->
      filename = "file#{i}"
      total = read_file_chunks(filename, 0)
      acc + total
    end)
  end

  defp read_file_chunks(filename, acc) do
    {:ok, device} = File.open(filename, [:read, :binary])
    total = read_chunks_loop(device, acc)
    File.close(device)
    total
  end

  defp read_chunks_loop(device, acc) do
    case IO.read(device, @read_chunk_size) do
      {:error, _} -> acc
      :eof -> acc
      data when is_binary(data) ->
        read_chunks_loop(device, acc + byte_size(data))
    end
  end

  defp cleanup_files(file_count) do
    for i <- 0..(file_count - 1) do
      filename = "file#{i}"
      File.rm!(filename)
    end
  end
end
