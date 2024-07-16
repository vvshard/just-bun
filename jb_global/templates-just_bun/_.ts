// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

import { $ } from 'bun';
import { p$, csl, err } from "../funcs.ts"

//----//////----//////----//////----//////----//////----//////----//////

export async function runRecipe(recipeName: string, args = []) {
    switch (recipeName) {
        case undefined: // default
        
            return;

        default:
            return err(`recipeName error: '${recipeName}'`);
    }
}
