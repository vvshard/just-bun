// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

import { $ } from "bun";
import { p$, csl, err } from "./funcs.ts"

//----//////----//////----//////----//////----//////----//////----//////

export async function runRecipe(recipeName, args = []) {
    switch (recipeName) {
        case undefined: // default
            await $`echo 'Hello: **_global/just_bun.ts'`;
            break;
        default:
            return err(`recipeName error: '${recipeName}'`);
    }
}
