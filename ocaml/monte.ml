let estimate_pi n =
  (* Создаем генератор с фиксированным seed = 42 *)
  let rng = Random.State.make [|42|] in
  let inside = ref 0 in
  
  for i = 1 to n do
    let x = Random.State.float rng 1.0 in
    let y = Random.State.float rng 1.0 in
    if (x *. x) +. (y *. y) <= 1.0 then
      incr inside
  done;
  
  4.0 *. (float_of_int !inside) /. (float_of_int n)

let main () =
  if Array.length Sys.argv < 2 then
    (Printf.eprintf "Usage: %s <number_of_iterations>\n" Sys.argv.(0); exit 1)
  else
    let n = int_of_string Sys.argv.(1) in
    let pi_estimate = estimate_pi n in
    Printf.printf "π ≈ %.10f\n" pi_estimate;
    Printf.printf "Error: %.10f\n" (abs_float (Float.pi -. pi_estimate))

let () = main ()