{-# LANGUAGE BangPatterns #-}

import System.Environment (getArgs)
import Data.Word (Word64)

main :: IO ()
main = do
  [nStr] <- getArgs
  let !n = read nStr :: Int
      !seed = 42
  let !inside = monteCarlo n seed 0 0
  putStrLn $ show $ 4.0 * fromIntegral inside / fromIntegral n

lcg :: Word64 -> Word64
lcg x = x * 6364136223846793005 + 1442695040888963407

randDouble :: Word64 -> (Double, Word64)
randDouble x =
  let x' = lcg x
      d = fromIntegral x' * (1.0 / fromIntegral (maxBound :: Word64))
  in (d, x')

monteCarlo :: Int -> Word64 -> Int -> Int -> Int
monteCarlo 0 _ !acc _ = acc
monteCarlo !i !state !acc !calls =
  let (x, state1) = randDouble state
      (y, state2) = randDouble state1
      !acc' = if x * x + y * y <= 1.0 then acc + 1 else acc
  in monteCarlo (i - 1) state2 acc' (calls + 1)