// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

import { $ } from "bun";
import { p$, msg, err } from "./funcs.ts"

//----//////----//////----//////----//////----//////----//////----//////

export async function runRecipe(recipeName: string, args = []) {
    switch (recipeName) {
        case '# msg about global file just_bun.ts':
        case undefined: // default
            await $`echo 'Hello: This is the global file just_bun.ts'`;
            break;
        default:
            return err(`recipeName error: '${recipeName}'`);
    }
}
