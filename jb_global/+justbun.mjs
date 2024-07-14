// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

//@ts-check
import { $ } from "bun";
import * as funcs from "./funcs.mjs"
import path from "path";

//----//////----//////----//////----//////----//////----//////----//////

const jb_global = path.dirname(Bun.main);

export async function runRecipe(recipeName, args = []) {
    switch (recipeName) {
        case undefined: // default
        // process.chdir('C:/Users/vvsh/AppData/Local/Programs/Notepad2e');
        await  $`C:/Users/vvsh/code/Rust/projects/my/snake/target/release/snake.exe`.nothrow();
            return;

        default:
            return funcs.err(`recipeName error: '${recipeName}'`);
    }
}
