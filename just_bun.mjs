// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

//@ts-check
import { $ } from 'bun';
import * as funcs from "C:\\Users\\vvsh\\.bun\\j_global/funcs.mjs";

//----//////----//////----//////----//////----//////----//////----//////

export async function runRecipe(recipeName, args = []) {
    switch (recipeName) {
        case undefined: // default
            await funcs.p$`echo "Hello World!"`
            await funcs.p$`ls pust_bun.mjs`.nothrow();
            await funcs.p$`echo filename: "${__filename}"`;
            await funcs.p$`
                echo "Hello World!"
                ls pust_bun.mjs
                echo filename: "${__filename}"
                `;
            return;

        default:
            return funcs.err(`recipeName error: '${recipeName}'`);
    }
}
