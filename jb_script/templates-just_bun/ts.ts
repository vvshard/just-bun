// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

import { $ } from 'bun';
import { p$, csl, err, decode_uXXXX } from "../funcs.ts"
import path from 'path';

//----//////----//////----//////----//////----//////----//////----//////

const main = __dirname + './src/index.ts';
const outdir = __dirname + './out';

export async function runRecipe(recipeName: string, args: string[] = []) {
    switch (recipeName) {
        case 'run':
        case 'r':
        case undefined: // default
            await p$`bun ${main}`;
            break;
        case 'build':
        case 'b':
            await p$`bun build ${main} --outdir ${outdir}`;
            break;
        case 'buildU': // decode \uXXXX
        case 'u':
            buildAndDecode_uXXXX();
            break;
        case 'buildW':
        case 'w':
            await p$`bun --watch build ${main} --outdir ${outdir}`;
            break;
        case 'buildTB': // target bun
        case 'tb':
            await p$`bun build ${main} --outdir ${outdir} --target bun`;
            break;
        default:
            return err(`recipeName error: '${recipeName}'`);
    }
}

async function buildAndDecode_uXXXX() {
    let ns = Bun.nanoseconds();
    const build = await Bun.build({ entrypoints: [main] });
    let out = await build.outputs.find(o => o.kind === 'entry-point')!.text();
    console.log(`[${((-ns + (ns = Bun.nanoseconds())) / 1000_000).toFixed()} ms] build`);
    out = decode_uXXXX(out);
    console.log(`[${((-ns + (ns = Bun.nanoseconds())) / 1000_000).toFixed()} ms] decoding`);
    const outFile = path.join(outdir, path.basename(main));
    await Bun.write(outFile, out);
    console.log(`[${((Bun.nanoseconds() - ns) / 1000_000).toFixed()} ms] write`);
}
