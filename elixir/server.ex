#!/usr/bin/env elixir

defmodule Main do
  def main() do
    n = System.argv() |> List.first() |> String.to_integer()
    
    # Создаем состояние
    {:ok, agent} = Agent.start_link(fn -> %{sum: 0, count: 0, n: n, done: false} end)
    
    # Запускаем сервер
    {:ok, socket} = :gen_tcp.listen(8080, [:binary, :inet, {:reuseaddr, true}, {:active, false}])
    
    # Принимаем соединения
    accept_loop(socket, agent)
  end
  
  defp accept_loop(socket, agent) do
    {:ok, client_socket} = :gen_tcp.accept(socket)
    spawn(fn -> handle_request(client_socket, agent) end)
    accept_loop(socket, agent)
  end
  
  defp handle_request(socket, agent) do
    {:ok, request} = :gen_tcp.recv(socket, 0)
    process_http_request(request, socket, agent)
    :gen_tcp.close(socket)
  end
  
  defp process_http_request(request, socket, agent) do
    # Ищем тело запроса
    [_, body] = String.split(request, "\r\n\r\n", parts: 2)
    
    # Простой парсинг JSON
    [_, number_str] = Regex.run(~r/\{"data"\s*:\s*(-?\d+)\}/, body)
    {data, ""} = Integer.parse(number_str)
    
    # Атомарно обновляем состояние через Agent
    Agent.update(agent, fn state ->
      new_count = state.count + 1
      new_sum = state.sum + data
      
      if new_count >= state.n and not state.done do
        IO.puts(new_sum)
        System.halt(0)
        %{state | sum: new_sum, count: new_count, done: true}
      else
        %{state | sum: new_sum, count: new_count}
      end
    end)
    
    send_response(socket, "OK")
  end
  
  defp send_response(socket, body) do
    response = "HTTP/1.1 200 OK\r\nContent-Length: #{byte_size(body)}\r\n\r\n#{body}"
    :gen_tcp.send(socket, response)
  end
end