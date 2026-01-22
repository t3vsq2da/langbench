import System.Environment

fib :: Int -> Int
fib n = if n < 2 then n else fib (n-1) + fib (n-2)

main :: IO ()
main = do
  args <- getArgs
  let n = read (head args)
  print (fib n)
