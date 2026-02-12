{-# LANGUAGE OverloadedStrings #-}

import Network.Socket
import Network.Socket.ByteString (recv, sendAll)
import Control.Concurrent (forkIO, newMVar, modifyMVar_, newEmptyMVar, tryPutMVar, tryTakeMVar, MVar, modifyMVar)
import qualified Data.ByteString as BS
import qualified Data.ByteString.Char8 as C8
import System.IO (stdout, hFlush)
import Data.List (isPrefixOf)
import System.Environment (getArgs)
import Foreign.C.Types (CInt(..))

foreign import ccall "stdlib.h exit"
  c_exit :: CInt -> IO ()


getContentLength :: BS.ByteString -> Maybe Int
getContentLength request = do
    let headerLines = C8.lines request
    let clLine = findLineStartingWith "Content-Length:" headerLines
    case clLine of
        Nothing -> Nothing
        Just l -> case C8.readInt (C8.dropWhile (== ' ') $ BS.drop 16 l) of
            Nothing -> Nothing
            Just (len, _) -> Just len
  where
    findLineStartingWith prefix lines = listToMaybe $ filter (BS.isPrefixOf (C8.pack prefix)) lines
    listToMaybe [] = Nothing
    listToMaybe (x:_) = Just x

extractDataFromBody :: BS.ByteString -> Maybe Int
extractDataFromBody body = do
    let s = C8.unpack body
    let needle = "\"data\":"
    let index = findSubstringIndex needle s
    case index of
        Nothing -> Nothing
        Just i -> case reads (drop (i + length needle) s) of
            [(n, rest)] -> Just n
            _ -> Nothing
  where
    findSubstringIndex :: String -> String -> Maybe Int
    findSubstringIndex sub str = go 0 str
      where
        go n s'
          | sub `isPrefixOf` s' = Just n
          | null s' = Nothing
          | otherwise = go (n + 1) (tail s')


recvRequest :: Socket -> IO (BS.ByteString, BS.ByteString)
recvRequest sock = do
    initial <- recv sock 1024
    let (headers, rest) = BS.breakSubstring "\r\n\r\n" initial

    if BS.null rest
        then do
            next <- recv sock 1024
            let full = initial <> next
            let (hdrs, rst) = BS.breakSubstring "\r\n\r\n" full
            if BS.null rst
                then error "No headers found"
                else do
                    let bodyStart = BS.drop 4 rst
                    let cl = getContentLength hdrs
                    case cl of
                        Nothing -> return (hdrs, bodyStart)
                        Just n -> do
                            let body = BS.take n bodyStart
                            return (hdrs, body)
        else do
            let bodyStart = BS.drop 4 rest
            let cl = getContentLength headers
            case cl of
                Nothing -> return (headers, bodyStart)
                Just n -> do
                    let body = BS.take n bodyStart
                    return (headers, body)

main :: IO ()
main = withSocketsDo $ do
  args <- getArgs
  let limit = case args of
        [nStr] -> read nStr
        _ -> error "Usage: prog <limit>"

  counter <- newMVar 0
  shutdownFlag <- newEmptyMVar
  totalSum <- newMVar 0

  addrInfos <- getAddrInfo
    (Just (defaultHints { addrFlags = [AI_PASSIVE] }))
    Nothing (Just "8080")
  let serverAddr = head addrInfos
  sock <- socket (addrFamily serverAddr) Stream defaultProtocol
  setSocketOption sock ReuseAddr 1
  bind sock (addrAddress serverAddr)
  listen sock 128
  
  let loop = do
        (conn, peerAddr) <- accept sock
        _ <- forkIO $ handle limit conn peerAddr counter totalSum shutdownFlag
        loop
  loop

handle :: Int -> Socket -> SockAddr -> MVar Int -> MVar Int -> MVar ()  -> IO ()
handle limit sock peerAddr counter tSum shutdownFlag = do
  shouldShutdown <- tryTakeMVar shutdownFlag
  case shouldShutdown of
    Just () -> close sock
    Nothing -> do
      (headers, body) <- recvRequest sock

      let bodyValue = case extractDataFromBody body of
            Just v -> v
            Nothing -> 0


      -- Увеличиваем счётчик
      count <- modifyMVar_ counter $ \n -> do
        let newN = n + 1
        hFlush stdout
        
        tsum <- modifyMVar tSum $ \v -> do
          let nSum = v + bodyValue
          hFlush stdout
          return (nSum,nSum)
          

        if newN >= limit
          then do
            putStrLn $ show tsum
            hFlush stdout
            tryPutMVar shutdownFlag ()
            c_exit 0
            return $! newN
          else return $! newN

      sendAll sock "HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nOK"
      close sock
