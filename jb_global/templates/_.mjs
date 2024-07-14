// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

//@ts-check
import { $ } from 'bun';
import * as funcs from "../funcs.mjs"
import path from 'path';

//----//////----//////----//////----//////----//////----//////----//////

const jb_global = path.dirname(Bun.main);

export async function runRecipe(recipeName, args = []) {
    switch (recipeName) {
        case undefined: // default
        
            return;

        default:
            return funcs.err(`recipeName error: '${recipeName}'`);
    }
}
