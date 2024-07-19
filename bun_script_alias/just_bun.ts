// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

import { $ } from "bun";
import { p$, csl, err } from "C:\\Users\\vvsh\\.bun\\j_script/funcs.ts";

export async function runRecipe(recipeName?: string, args = []) {
    switch (recipeName) {
        case 'run':
        case 'r':
        case undefined: // default
            await p$`cargo run`;
            break;
        case 'build_release':
        case 'b':
            await p$`cargo build --release`;
            csl(`Result in: ${__dirname}/target/release`);
            break;
        case 'test':
        case '# args: [filter] [-1] // -1: in one thread':
        case 't':
            await p$`cargo test ${{ raw: args.join(' ').replace('-1', '-- --test-threads=1') }}`;
            break;
        default:
            return err(`recipeName error: '${recipeName}'`);
    }
}
