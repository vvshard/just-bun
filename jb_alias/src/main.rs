// #![allow(unused)]

use std::{env, process::Command};

fn main() {
    // match env::current_exe() {
    //     Ok(exe_path) => println!("Path of this executable is: {}", exe_path.display()),
    //     Err(e) => println!("failed to get current exe path: {e}"),
    // };

    let mut path = env::current_exe().expect("Failed to get path to exe");
    let file_stem = path
        .file_stem()
        .expect("Failed to get exe file name.")
        .to_str()
        .expect("The exe file name is not Unicode")
        .to_owned();
    path.pop();
    path.pop();
    path.push(&format!("{file_stem}_global/main.js"));

    let args = env::args();

    Command::new("bun").arg(path).args(args.skip(1)).status().expect("Failed to start bun");
}
