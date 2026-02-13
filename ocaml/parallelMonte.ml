open Printf

(* Быстрый xorshift генератор *)
type rng = { mutable state : int }

let make_rng seed =
  { state = if seed = 0 then 1 else seed }

let next rng =
  let x = rng.state in
  rng.state <- x lxor (x lsl 13);
  rng.state <- rng.state lxor (rng.state lsr 17);
  rng.state <- rng.state lxor (rng.state lsl 5);
  rng.state

let rand_double rng =
  let n = next rng in
  (* Конвертируем в [0, 1) *)
  float_of_int (abs n) /. 1073741824.0  (* 2^30 *)

(* Рабочая функция (независимая, без побочных эффектов) *)
let worker seed iterations =
  let rng = make_rng seed in
  let rec loop hits remaining =
    if remaining <= 0 then hits
    else
      let x = rand_double rng in
      let y = rand_double rng in
      let hit = if x *. x +. y *. y <= 1.0 then 1 else 0 in
      loop (hits + hit) (remaining - 1)
  in
  loop 0 iterations

(* Параллельная версия с Domain *)
let parallel_monte_carlo threads total =
  let per_thread = total / threads in
  
  (* Создаем домены *)
  let domains = Array.init threads (fun i ->
    Domain.spawn (fun () -> worker i per_thread)
  ) in
  
  (* Собираем результаты *)
  let hits = Array.map Domain.join domains in
  let total_hits = Array.fold_left ( + ) 0 hits in
  
  (* Вычисляем π *)
  4.0 *. (float_of_int total_hits) /. (float_of_int total)

let main () =
  let threads = int_of_string Sys.argv.(1) in
  let total = int_of_string Sys.argv.(2) in
  
  let pi_estimate = parallel_monte_carlo threads total in
  printf "%f\n" pi_estimate

let () = main ()