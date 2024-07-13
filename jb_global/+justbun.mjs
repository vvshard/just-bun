// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

import { $ } from 'bun';
import path from 'path';

/** @type {{ p$: typeof $, cl: {nrm, err}}} */
// const { p$, cl, decode_uXXXX } = await import(Bun.main.slice(0, -7) + 'funcs.mjs'); // local
import { p$, cl, decode_uXXXX } from './funcs.mjs' // global / dbg 


//----//////----//////----//////----//////----//////----//////----//////

const jb_global = path.dirname(Bun.main);

export async function runRecipe(recipeName, /**@type {string[]}*/ args = []) {
    switch (recipeName) {
        case undefined: // default
        // process.chdir('C:/Users/vvsh/AppData/Local/Programs/Notepad2e');
        await  $`C:/Users/vvsh/code/Rust/projects/my/snake/target/release/snake.exe`.nothrow();
            return;

        default:
            return cl.err(`recipeName error: '${recipeName}'`);
    }
}
