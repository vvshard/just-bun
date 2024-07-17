use std::{env, process::Command};

fn main() {
    let mut path = env::current_exe().expect("Failed to get path to exe");
    let file_stem = path
        .file_stem()
        .expect("Failed to get exe file name.")
        .to_str()
        .expect("The exe file name is not Unicode")
        .to_string();
    let path_exe = path.to_str().expect("The exe file path is not Unicode").to_string();
    path.pop();
    path.pop();
    path.push(&(file_stem + "_script"));
    path.push("main.js");

    let mut args = env::args();
    match args.nth(1) {
        None => Command::new("bun").arg(path).status(),
        Some(arg) => {
            if arg == "--help" {
                println!(
                    "Run {path_exe} --help:\n description: This in turn is only run:$ bun \"{}\" [...args]",
                    path.to_str().unwrap()
                );
            }
            Command::new("bun").arg(path).arg(arg).args(args).status()
        }
    }
    .expect("Failed to start bun");
}
