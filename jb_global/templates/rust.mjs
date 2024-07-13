// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

import { $ } from "bun"
/** @type {{ p$: typeof $, cl: {nrm, err}}} */
const { p$, cl } = await import(Bun.main.slice(0, -7) + 'funcs.mjs'); // local
// import { p$, cl } from './funcs.mjs' // global / dbg 

//----//////----//////----//////----//////----//////----//////----//////

export async function runRecipe(recipeName, args = []) {
    switch (recipeName) {
        case 'run':
        case 'r':
        case undefined: // default
            return await p$`
    cargo run
    `;
        case 'build_release':
        case 'b':
            return await p$`
    cargo build --release
    `;
        case 'test':
        case 't':
            return await p$`
    cargo test
    `;
        default:
            return cl.err(`recipeName error: '${recipeName}'`);
    }
}
