import path from "path";
import { $ } from "bun";

const jb_global = path.dirname(Bun.main);

export async function start(args: string[]) {
    // console.log(`args: ${args}`);
    let isGlob = false;
    let displayList = false;

    switch (args[0]) {
        case '--help':
        case '-h':
            return printHelp();
        case '-@':
            return installTypes();
        case '-u':
            return mainupdate();
        case '-p':
            return console.log(`Path to just_bun.js: ${findPath()}/`);
        case '-pg':
            return console.log(`Path to global just_bun.js: ${jb_global}/`);
        case '-lg':
            isGlob = true;
        case '-l':
            displayList = true;
            break;
        case '-g':
            isGlob = true;
    }

    let runnerPath = (isGlob ? jb_global : findPath()) + '/just_bun.js';
    if (runnerPath === 'Not found ↑/just_bun.js') return console.log(runnerPath);

    const { runRecipe }: { runRecipe: (recipeName: any, args?: string[]) => Promise<any> }
        = await import(runnerPath);

    if (!runRecipe) return console.log(`${runnerPath} does not contain function runRecipe()`);

    if (displayList) return console.log(parseRecipes(runRecipe.toString()));

    if (isGlob) {
        args.shift();
    }
    await runRecipe(args.shift(), args);
}

function findPath(): string {
    let currentPath = '.';
    let parentPath = process.cwd();

    do {
        if (Bun.file(parentPath + '/just_bun.js').size !== 0)
            return currentPath === '.' ? '.' : parentPath;
        currentPath = parentPath;
        parentPath = path.dirname(currentPath);
    } while (parentPath != currentPath);

    return 'Not found ↑';
}

function printHelp() {
    console.log('Help3');

}

function installTypes() {
    throw new Error("Function installTypes() not implemented.");
}

function parseRecipes(arg0: string): string {
    throw new Error("Function parseRecipes() not implemented.");
}

async function mainupdate() {
    const mainTs = jb_global + "/mainupdate/main.ts";
    if (Bun.file(mainTs).size === 0) return console.log("Not found " + mainTs);
    await $`
bun i
bun build ./main.ts --outdir ../ --target bun`
        .cwd(jb_global + "/mainupdate");
}
