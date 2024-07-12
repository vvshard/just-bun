// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

// import { p$ } from './funcs.mjs' // global / dbg 
const { p$ } = await import(Bun.main.slice(0, -7) + 'funcs.mjs'); // local

//----//////----//////----//////----//////----//////----//////----//////

export async function runRecipe(recipeName, args = []) {
    switch (recipeName) {
        case 'run':
        case 'r':
        case undefined: // default
            await p$`cargo run`;
            return;

        case 'build_release':
        case 'b':
            await p$`cargo build --release`;
            return;

        case 'test':
        case 't':
             await p$`cargo test`;
             break;

        default:
            return console.log(`recipeName error: '${recipeName}'`);
    }
}
