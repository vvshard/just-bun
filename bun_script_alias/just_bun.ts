// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

import { $ } from "bun";

export async function runRecipe(recipeName?: string, args = []) {
    switch (recipeName) {
        case '# compiling in debug mode and running the program':
        case 'run':
        case 'r':
        case undefined: // default
            await $`cargo run`;
            break;
        case 'build_release':
        case 'b':
            await $`cargo build --release`;
            await $`echo "Result in: ${__dirname}/target/release"`;
            break;
        case '# run tests; args: [filter] [-1] // -1: in one thread':
        case 'test':
        case 't':
            await $`cargo test ${{raw: args.join(' ').replace('-1', '-- --test-threads=1')}}`;
            break;
        default:
            return console.log(`recipeName error: '${recipeName}'`);
    }
}
