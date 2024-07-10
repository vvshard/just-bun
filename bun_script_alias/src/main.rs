use std::{env, process::Command};

fn main() {
    let mut path = env::current_exe().expect("Failed to get path to exe");
    let file_stem = path
        .file_stem()
        .expect("Failed to get exe file name.")
        .to_str()
        .expect("The exe file name is not Unicode")
        .to_string();
    path.pop();
    path.pop();
    path.push(&(file_stem + "_global/main.js"));

    Command::new("bun").arg(path).args(env::args().skip(1)).status().expect("Failed to start bun");
}
