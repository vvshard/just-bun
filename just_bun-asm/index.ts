import path from "path";
import { parseRecipes } from "./parseRecipes";
import * as optFn from "./optionsFuncs";

export async function start(args: string[]) {
    let isGlob = false;
    let displayList: 'none' | 'show' | 'select' = 'none';
    let runnerPath = "";

    switch (args[0]) {
        case '--help':
        case '-h':
            return printHelp();
        case '-t':
            return optFn.jbFromTemplate(args[1]);
        case '-@':
            return optFn.installTypes();
        case '-u':
            return optFn.mainupdate();
        case '-P':
            return optFn.csl(`Path to global recipe file: ${optFn.jb_global}/just_bun.ts`);
        case '-p':
            return optFn.csl(`Path to recipe file: ${optFn.findPath()}`);
        case '-O':
            return optFn.openInEditor(optFn.jb_global + '/just_bun.ts');
        case '-o':
            return optFn.openInEditor(optFn.findPath());
        case '-L':
            isGlob = true;
        case '-l':
            displayList = 'show';
            break;
        case '-N':
            isGlob = true;
        case '-n':
            displayList = 'select';
            break;
        case '-f':
            args.shift();
            runnerPath = args.shift() ?? "";
            if (!runnerPath)
                return optFn.err('File path not passed');
            if (Bun.file(runnerPath).size === 0 || !runnerPath.endsWith('js'))
                return optFn.err('Incorrect file path');
            break;
        case '-g':
            args.shift();
            isGlob = true;
    }
    if (!runnerPath) {
        runnerPath = (isGlob ? optFn.jb_global : optFn.findPath());
        if (runnerPath === 'Not found ↑')
            return optFn.err('Not found ↑ just_bun.ts');
    }
    const { runRecipe }: { runRecipe: (recipeName: any, args?: string[]) => Promise<any> }
        = await import(path.resolve(runnerPath));

    if (!runRecipe)
        return optFn.err(`${runnerPath} does not contain function runRecipe()`);

    if (displayList === 'show')
        return optFn.csl(`List of recipes in ${runnerPath}: \n${parseRecipes(runRecipe.toString())}`);

    if (displayList === 'select')
        return optFn.runByNumber(runRecipe);

    await runRecipe(args.shift(), args);
}

function printHelp() {
    optFn.csl('Help3');

}


