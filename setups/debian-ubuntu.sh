sudo apt install 7zip curl time gcc clang ghc openjdk-25-jdk elixir rustc python3 pypy3 perl nodejs golang-go ocaml cabal-install
#deno
curl -OSL https://github.com/denoland/deno/releases/download/v2.6.9/deno-x86_64-unknown-linux-gnu.zip
7z e deno-x86_64-unknown-linux-gnu.zip
sudo cp deno /usr/bin
rm ./deno-x86_64-unknown-linux-gnu.zip
rm ./deno
#nim
curl -O https://nim-lang.org/download/nim-2.2.6-linux_x64.tar.xz
tar -xvf ./nim-2.2.6-linux_x64.tar.xz
sudo ./nim-2.2.6/install.sh
rm ./nim-2.2.6-linux_x64.tar.xz
rm -fdr ./nim-2.2.6
#oha
echo "deb [signed-by=/usr/share/keyrings/azlux-archive-keyring.gpg] http://packages.azlux.fr/debian/ stable main" | sudo tee /etc/apt/sources.list.d/azlux.list
sudo wget -O /usr/share/keyrings/azlux-archive-keyring.gpg https://azlux.fr/repo.gpg
sudo apt update
sudo apt install oha
#haskell
cabal update
cabal install --lib network