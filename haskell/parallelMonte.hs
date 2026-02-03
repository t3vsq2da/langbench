import System.Environment
import Control.Concurrent
import Control.Monad

-- Примитивный генератор: next = (state * A + C) mod M
nextRand :: Int -> (Double, Int)
nextRand state =
  let a = 1664525
      c = 1013904223
      m = 2147483647  -- 2^31 - 1
      newState = (a * state + c) `mod` m
      randVal = fromIntegral newState / fromIntegral m
  in (randVal, newState)

-- Генерация пары (x, y) и подсчёт попаданий
countHits :: Int -> Int -> Int -> Int
countHits _ 0 acc = acc
countHits state n acc =
  let (x, state1) = nextRand state
      (y, state2) = nextRand state1
      newAcc = if x*x + y*y <= 1.0 then acc + 1 else acc
  in countHits state2 (n - 1) newAcc

worker :: Int -> Int -> IO Int
worker seed perThread = return $! countHits seed perThread 0

main :: IO ()
main = do
  args <- getArgs
  let threads = read (args !! 0)
      total = read (args !! 1)
      perThread = total `div` threads

  mvars <- forM [0..threads-1] $ \t -> do
    mvar <- newEmptyMVar
    forkIO $ do
      let seed = t + 12345
      hits <- worker seed perThread
      putMVar mvar hits
    return mvar

  results <- mapM takeMVar mvars
  let totalHits = sum results
      piEstimate = 4.0 * fromIntegral totalHits / fromIntegral (perThread * threads)
  print piEstimate