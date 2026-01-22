{-# LANGUAGE BangPatterns #-}

import System.Environment (getArgs)
import System.IO
import qualified Data.ByteString as BS
import Data.ByteString.Builder (byteString, toLazyByteString)
import qualified Data.ByteString.Lazy as LBS
import System.Directory (removeFile)

main :: IO ()
main = do
  [fileCountStr, nStr] <- getArgs
  let !fileCount = read fileCountStr :: Int
      !n = read nStr :: Int

  -- Pre-create content with n '1' characters
  let !content = BS.replicate n 49  -- 49 is ASCII for '1'

  -- Write phase
  writeFiles fileCount content

  -- Read phase - read in chunks and count total bytes
  !totalBytes <- readFiles fileCount

  -- Count chunks of 65536 bytes
  let !totalChunks = totalBytes `div` 65536
  print totalChunks

  -- Cleanup
  cleanupFiles fileCount

writeFiles :: Int -> BS.ByteString -> IO ()
writeFiles fileCount content = do
  let filenames = ["file" ++ show i | i <- [0..fileCount-1]]
  mapM_ (\fname -> BS.writeFile fname content) filenames

readFiles :: Int -> IO Integer
readFiles fileCount = do
  let filenames = ["file" ++ show i | i <- [0..fileCount-1]]
  total <- sum <$> mapM readFileSize filenames
  return $! fromIntegral total

readFileSize :: FilePath -> IO Int
readFileSize filename = do
  handle <- openBinaryFile filename ReadMode
  total <- readChunks handle 0
  hClose handle
  return total
  where
    readChunks :: Handle -> Int -> IO Int
    readChunks h !acc = do
      chunk <- BS.hGet h 65536
      if BS.null chunk
        then return acc
        else readChunks h (acc + BS.length chunk)

cleanupFiles :: Int -> IO ()
cleanupFiles fileCount = do
  let filenames = ["file" ++ show i | i <- [0..fileCount-1]]
  mapM_ removeFile filenames