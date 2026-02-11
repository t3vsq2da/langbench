(* silent_counter_fixed.ml *)
open Unix

let limit =
  try int_of_string Sys.argv.(1)
  with _ -> 5

let total = ref 0
let count = ref 0
let lock = Mutex.create ()
let exiting = ref false   (* флаг, что уже завершаемся *)

let extract_number s =
  try
    let re = Str.regexp {|"data":[^0-9-]*\(-?[0-9]+\)|} in
    ignore (Str.search_forward re s 0);  (* ищем и обновляем состояние *)
    let num_str = Str.matched_group 1 s in
    int_of_string num_str
  with Not_found -> 0

let handle client_fd =
  try
    let buf = Bytes.make 4096 '\x00' in
    let bytes_read = recv client_fd buf 0 4096 [] in
    if bytes_read > 0 then
      let body = Bytes.sub_string buf 0 bytes_read in
      let data = extract_number body in

      (* Критическая секция: обновление счётчиков и проверка лимита *)
      Mutex.lock lock;
      if not !exiting then (
        total := !total + data;
        count := !count + 1;
        if !count >= limit then (
          exiting := true;
          let final_sum = !total in
          Mutex.unlock lock;   (* можно отпустить, дальше exit всё равно *)
          print_int final_sum;
          print_newline ();
          flush Stdlib.stdout;
          exit 0
        )
      );
      Mutex.unlock lock;

      (* Отправляем ответ *)
      let response = Bytes.of_string "HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nOK\n" in
      ignore (send client_fd response 0 (Bytes.length response) []);
      close client_fd
    else
      close client_fd
  with _ ->
    try close client_fd with _ -> ()

let () =
  let server = socket PF_INET SOCK_STREAM 0 in
  setsockopt server SO_REUSEADDR true;
  bind server (ADDR_INET (inet_addr_any, 8080));
  listen server 10;

  while true do
    let (client_fd, _) = accept server in
    ignore (Thread.create handle client_fd)
  done