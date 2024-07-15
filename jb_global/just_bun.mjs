// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

//@ts-check
import { $ } from "bun";
import * as funcs from "./funcs.mjs"

//----//////----//////----//////----//////----//////----//////----//////

export async function runRecipe(recipeName, args = []) {
    switch (recipeName) {
        case undefined: // default
            return await $`
    echo Hello World!
    `;

        default:
            return funcs.err(`recipeName error: '${recipeName}'`);
    }
}
