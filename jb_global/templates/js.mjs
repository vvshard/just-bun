// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

//@ts-check
import { $ } from 'bun';
import * as funcs from "../funcs.mjs"
import path from 'path';

//----//////----//////----//////----//////----//////----//////----//////

const main = __dirname + '/../tests/index.js';
const outdir = __dirname + '../tests/out';

export async function runRecipe(recipeName, args = []) {
    switch (recipeName) {
        case 'run':
        case 'r':
        case undefined: // default
            return await funcs.p$`
    bun ${main}
    `;
        case 'build':
        case 'b':
            return await funcs.p$`
    bun build ${main} --outdir ${outdir}
    `;
        case 'buildU': // decode \uXXXX
        case 'u':
            return buildAndDecode_uXXXX();

        case 'buildW':
        case 'w':
            return await funcs.p$`
    bun --watch build ${main} --outdir ${outdir}
    `;
        case 'buildTB': // target bun
        case 'tb':
            return await funcs.p$`
    bun build ${main} --outdir ${outdir} --target bun
    `;
        default:
            return funcs.err(`recipeName error: '${recipeName}'`);
    }
}

async function buildAndDecode_uXXXX() {
    let ns = Bun.nanoseconds();
    const build = await Bun.build({ entrypoints: [main] });
    let out = await build.outputs.find(o => o.kind === 'entry-point')?.text() ?? 'entry-point not found';
    funcs.csl(`[${((-ns + (ns = Bun.nanoseconds())) / 1000_000).toFixed()} ms] build`);
    out = funcs.decode_uXXXX(out);
    funcs.csl(`[${((-ns + (ns = Bun.nanoseconds())) / 1000_000).toFixed()} ms] decoding`);
    const outFile = path.join(outdir, path.basename(main));
    await Bun.write(outFile, out);
    funcs.csl(`[${((Bun.nanoseconds() - ns) / 1000_000).toFixed()} ms] write`);
}
