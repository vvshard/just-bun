# manual just: https://just.systems/man/en/chapter_1.html

set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]

default: run

alias t := test
alias r := run
alias b := build_release

# >t cargo test
test $RUST_BACKTRACE='0':
    cargo test

# >r cargo run
run $RUST_BACKTRACE='0':
    cargo run

# >b cargo build --release
build_release:
    cargo build --release
