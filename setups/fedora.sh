sudo dnf install time 7zip gcc clang ghc java-latest-openjdk-devel elixir rust python3 pypy3 nodejs perl golang ocaml cargo cabal-install
#deno
curl -OSL https://github.com/denoland/deno/releases/download/v2.6.9/deno-x86_64-unknown-linux-gnu.zip
7z e deno-x86_64-unknown-linux-gnu.zip
sudo cp deno /usr/bin
rm ./deno-x86_64-unknown-linux-gnu.zip
rm ./deno
#nim
curl -O https://nim-lang.org/download/nim-2.2.6-linux_x64.tar.xz
tar -xvf ./nim-2.2.6-linux_x64.tar.xz
cd ./nim-2.2.6
sudo ./install.sh /usr/bin
cd ../
rm ./nim-2.2.6-linux_x64.tar.xz
rm -fdr ./nim-2.2.6
#oha
cargo install oha
sudo ln -sf ~/.cargo/bin/oha /usr/bin/oha
#haskell
cabal update
cabal install --lib network
