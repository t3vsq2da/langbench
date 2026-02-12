sudo apt install 7zip curl time gcc clang ghc openjdk-25-jdk elixir rustc python3 pypy3 perl nodejs golang-go ocaml
curl -OSL https://github.com/denoland/deno/releases/download/v2.6.9/deno-x86_64-unknown-linux-gnu.zip
7z e deno-x86_64-unknown-linux-gnu.zip
sudo cp deno /usr/bin
curl -O https://nim-lang.org/download/nim-2.2.6-linux_x64.tar.xz
tar -xvf ./nim-2.2.6-linux_x64.tar.xz
sudo ./install.sh

cabal update
cabal install --lib network bytestring directory