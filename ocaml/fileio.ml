open Printf

let main () =
  let fileCount = int_of_string Sys.argv.(1) in
  let n = int_of_string Sys.argv.(2) in
  
  (* 1. Фаза записи *)
  
  (* Pre-allocate buffer with n '1' characters *)
  let write_buffer = String.make n '1' in
  
  (* Write phase - write entire buffer at once *)
  for i = 0 to fileCount - 1 do
    let filename = "file" ^ string_of_int i in
    let oc = open_out_bin filename in
    output_string oc write_buffer;
    close_out oc
  done;
  
  (* 2. Фаза чтения *)
  
  let total_bytes = ref 0 in
  let read_buffer_size = 65536 in  (* 64 KiB read buffer *)
  let read_buffer = Bytes.create read_buffer_size in
  
  (* Read phase - read in chunks and count total bytes *)
  for i = 0 to fileCount - 1 do
    let filename = "file" ^ string_of_int i in
    let ic = open_in_bin filename in
    
    let rec read_loop () =
      let bytes_read = input ic read_buffer 0 read_buffer_size in
      if bytes_read > 0 then (
        total_bytes := !total_bytes + bytes_read;
        read_loop ()
      )
    in
    
    read_loop ();
    close_in ic
  done;
  
  (* 3. Подсчет чанков и вывод результата *)
  
  let chunk_size = 65536 in
  let total_chunks = !total_bytes / chunk_size in
  printf "%d\n" total_chunks;
  
  (* 4. Очистка файлов *)
  
  for i = 0 to fileCount - 1 do
    let filename = "file" ^ string_of_int i in
    Sys.remove filename
  done

let () = main ()