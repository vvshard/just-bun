// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

import { $ } from 'bun';
import { p$, csl, err } from "../funcs.ts"

//----//////----//////----//////----//////----//////----//////----//////

export async function runRecipe(recipeName?: string, args = []) {
    switch (recipeName) {
        case '# Empty recipe file message':
        case undefined: // default
            await $`echo 'Hello: This is an empty recipe file.'`;
            break;
        default:
            return err(`recipeName error: '${recipeName}'`);
    }
}
