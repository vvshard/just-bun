// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

import { $ } from "bun";
import { p$, csl, err } from "C:\\Users\\vvsh\\.bun\\j_script/funcs.ts";

//----//////----//////----//////----//////----//////----//////----//////

export async function runRecipe(recipeName: string, args = []) {
    switch (recipeName) {
        case 'run':
        case 'r':
        case undefined: // default
            await p$`cargo run`;
            break;
        case 'build_release':
        case 'b':
            await p$`cargo build --release`;
            break;
        case 'test':
        case 't':
            await p$`cargo test`;
            break;
        default:
            return err(`recipeName error: '${recipeName}'`);
    }
}
