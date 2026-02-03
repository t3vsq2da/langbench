let rec fib n =
  if n <= 1 then n
  else fib (n - 1) + fib (n - 2)

let main () =
  if Array.length Sys.argv < 2 then
    (Printf.eprintf "Usage: %s <number>\n" Sys.argv.(0); exit 1)
  else
    let n = int_of_string Sys.argv.(1) in
    Printf.printf "%d\n" (fib n)

let () = main ()