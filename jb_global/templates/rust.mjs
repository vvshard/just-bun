// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

//@ts-check
import { $ } from "bun";
import * as funcs from "../funcs.mjs"

//----//////----//////----//////----//////----//////----//////----//////

export async function runRecipe(recipeName, args = []) {
    switch (recipeName) {
        case 'run':
        case 'r':
        case undefined: // default
            await funcs.p$`
    cargo run
    `;
            break
        case 'build_release':
        case 'b':
            return await funcs.p$`
    cargo build --release
    `;
        case 'test':
        case 't':
            return await funcs.p$`
    cargo test
    `;
        default:
            return funcs.err(`recipeName error: '${recipeName}'`);
    }
}
