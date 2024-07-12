// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// bun: https://bun.sh/, BunSell: https://bun.sh/docs/runtime/shell
// To use Bun-API autocompletion (including node-API) in the IDE, 
//      you can install/refresh ./node_modules/@types: `$ jb -@`


import { $ } from 'bun';
import path from 'path';

import { p$, decode_uXXXX } from './funcs.mjs' // global / dbg 
// const { p$, decode_uXXXX } = await import(Bun.main.slice(0, -7) + 'funcs.js'); // local

//----//////----//////----//////----//////----//////----//////----//////

const main = __dirname + '/../tests/index.ts';
const outdir = __dirname + '../tests/out';

export async function runRecipe(recipeName, /**@type {string[]}*/ args = []) {
    switch (recipeName) {
        case 'run':
        case 'r':
        case undefined: // default
            return p$`bun ${main}`;

        case 'build':
        case 'b':
            return p$`bun build ${main} --outdir ${outdir}`;

        case 'buildU': // decode \uXXXX
        case 'u':
            return buildAndDecode_uXXXX();

        case 'buildW':
        case 'w':
            return p$`bun --watch build ${main} --outdir ${outdir}`;

        case 'buildTB': // target bun
        case 'tb':
            return p$`bun build ${main} --outdir ${outdir} --target bun`;

        default:
            return console.log(`recipeName error: '${recipeName}'`);
    }
}

async function buildAndDecode_uXXXX() {
    let ns = Bun.nanoseconds();
    const build = await Bun.build({ entrypoints: [main] });
    let out = await build.outputs.find(o => o.kind === 'entry-point').text();
    console.log(`[${((-ns + (ns = Bun.nanoseconds())) / 1000_000).toFixed()} ms] build`);
    out = decode_uXXXX(out);
    console.log(`[${((-ns + (ns = Bun.nanoseconds())) / 1000_000).toFixed()} ms] decoding`);
    const outFile = path.join(outdir, path.basename(main, '.ts') + '.js');
    await Bun.write(outFile, out);
    console.log(`[${((Bun.nanoseconds() - ns) / 1000_000).toFixed()} ms] write`);
}
