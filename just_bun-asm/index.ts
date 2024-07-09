import path from "path";

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
        case '-p':
            return console.log(`Path to just_bun.js: ${findPath()}/`);
        case '-pg':
            return console.log(`Path to global just_bun.js: ${path.dirname(Bun.main)}/`);
        case '-lg':
            isGlob = true;
        case '-l':
            displayList = true;
            break;
        case '-g':
            isGlob = true;
    }

    let runnerPath = (isGlob ? path.dirname(Bun.main) : findPath()) + '/just_bun.js';

    const { runRecipe }: { runRecipe: (recipeName: any, args?: string[]) => Promise<any> }
        = await import(runnerPath);

    if (!runRecipe) throw new Error(`${runnerPath} does not contain function runRecipe()`);

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
        if (Bun.file(parentPath + '/just_bun.js').size != 0)
            return currentPath === '.' ? '.' : parentPath;
        currentPath = parentPath;
        parentPath = path.dirname(currentPath);
    } while (parentPath != currentPath);

    throw new Error("Non-empty file just_bun.js not found");
}

function printHelp() {
    throw new Error("Function logHelp() not implemented.");
}

function installTypes() {
    throw new Error("Function not implemented.");
}

function parseRecipes(arg0: string): string {
    throw new Error("Function not implemented.");
}

