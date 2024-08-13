// A collection of BunSell recipes run by the command `$ jb <recipe> [...args]`
// BunSell: https://bun.sh/docs/runtime/shell

import { $ } from 'bun';
import { p$, msg, err, decode_uXXXX } from "../funcs.ts"
import path from 'path';

//----//////----//////----//////----//////----//////----//////----//////

const main = path.join( __dirname, 'src/index.ts');
const outdir = path.join( __dirname, 'out');

export async function runRecipe(recipeName?: string, args = []) {
    switch (recipeName) {
        case 'run':
        case 'r':
        case undefined: // default
            await p$`bun ${main}`;
            break;
        case 'test':
        case 't':
            await p$`bun test`.nothrow();
            break;
        case 'build':
        case 'b':
            await p$`bun build ${main} --outdir ${outdir}`;
            break;
        case 'buildU': 
        case '# build with decode \\uXXXX':
        case 'u':
            buildAndDecode_uXXXX();
            break;
        case 'build_watch':
        case 'w':
            await p$`bun --watch build ${main} --outdir ${outdir}`;
            break;
        case 'build_target_bun':
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
    const output = build.outputs.find(o => o.kind === 'entry-point')!;
    let out = await output.text();
    msg(`[${((-ns + (ns = Bun.nanoseconds())) / 1000_000).toFixed()} ms] build`);
    out = decode_uXXXX(out);
    msg(`[${((-ns + (ns = Bun.nanoseconds())) / 1000_000).toFixed()} ms] decoding`);
    await Bun.write(path.join(outdir, output.path), out);
    msg(`[${((Bun.nanoseconds() - ns) / 1000_000).toFixed()} ms] write`);
}
