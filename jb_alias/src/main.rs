// #![allow(unused)]

use std::{env, process::Command};

fn main() {
    // match env::current_exe() {
    //     Ok(exe_path) => println!("Path of this executable is: {}", exe_path.display()),
    //     Err(e) => println!("failed to get current exe path: {e}"),
    // };

    let mut path = env::current_exe().expect("Failed to get path to exe");
    path.pop();
    path.pop();
    path.push("jb_global/main.js");

    let args = env::args();
    // dbg!(&args);

    Command::new("bun")
        .arg(path)
        .args(args.skip(1))
        .status()
        .expect("Failed to start bun");
}
