// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

// import { p$ } from './funcs.js' // global / dbg 
const { p$ } = await import(Bun.main.slice(0, -7) + 'funcs.js'); // local

//----//////----//////----//////----//////----//////----//////----//////

export async function runRecipe(recipeName, /**@type {string[]}*/ args = []) {
    switch (recipeName) {
        case 'run':
        case 'r':
        case undefined: // default
            return await p$`cargo run`;

        case 'build_release':
        case 'b':
            return await p$`cargo build --release`;

        case 'test':
        case 't':
            return await p$`cargo test`;

        default:
            return console.log(`recipeName error: '${recipeName}'`);
    }
}
