// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell


import { $ } from 'bun';
import path from 'path';

/** @type {{ p$: typeof $, cl: {nrm, err}}} */
const { p$, cl, decode_uXXXX } = await import(Bun.main.slice(0, -7) + 'funcs.mjs'); // local
// import { p$, cl, decode_uXXXX } from './funcs.mjs' // global / dbg 

//----//////----//////----//////----//////----//////----//////----//////

const main = __dirname + './src/index.ts';
const outdir = __dirname + './out';

export async function runRecipe(recipeName, /**@type {string[]}*/ args = []) {
    switch (recipeName) {
        case 'run':
        case 'r':
        case undefined: // default
            return await p$`
    bun ${main}
    `;
        case 'build':
        case 'b':
            return await p$`
    bun build ${main} --outdir ${outdir}
    `;
        case 'buildU': // decode \uXXXX
        case 'u':
            return buildAndDecode_uXXXX();

        case 'buildW':
        case 'w':
            return await p$`
    bun --watch build ${main} --outdir ${outdir}
    `;
        case 'buildTB': // target bun
        case 'tb':
            return await p$`
    bun build ${main} --outdir ${outdir} --target bun
    `;
        default:
            return cl.err(`recipeName error: '${recipeName}'`);
    }
}

async function buildAndDecode_uXXXX() {
    let ns = Bun.nanoseconds();
    const build = await Bun.build({ entrypoints: [main] });
    let out = await build.outputs.find(o => o.kind === 'entry-point').text();
    console.log(`[${((-ns + (ns = Bun.nanoseconds())) / 1000_000).toFixed()} ms] build`);
    out = decode_uXXXX(out);
    console.log(`[${((-ns + (ns = Bun.nanoseconds())) / 1000_000).toFixed()} ms] decoding`);
    const outFile = path.join(outdir, path.basename(main));
    await Bun.write(outFile, out);
    console.log(`[${((Bun.nanoseconds() - ns) / 1000_000).toFixed()} ms] write`);
}
