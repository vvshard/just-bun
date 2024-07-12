// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

import { $ } from 'bun';
import path from 'path';

import { p$, decode_uXXXX } from './funcs.mjs' // global / dbg 
// const { p$, decode_uXXXX } = await import(Bun.main.slice(0, -7) + 'funcs.mjs'); // local

//----//////----//////----//////----//////----//////----//////----//////


export async function runRecipe(recipeName, /**@type {string[]}*/ args = []) {
    switch (recipeName) {
        case undefined: // default
            p$`bun ${main}`
            return ;

        default:
            return console.log(`recipeName error: '${recipeName}'`);
    }
}
