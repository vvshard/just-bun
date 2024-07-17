import path from "path";
import { parseRecipes } from "./parseRecipes";
import * as optFn from "./optionsFuncs";

export async function start(args: string[]) {
    let isGlobal = false;
    let displayList: 'none' | 'show' | 'select' = 'none';
    let runnerPath: string | undefined;

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
            return optFn.csl(`Path to global recipe file: ${optFn.jb_script}/just_bun.ts`);
        case '-p':
            return optFn.csl(`Path to recipe file: ${optFn.findPath() ?? 'Not found ↑'}`);
        case '-O':
            return optFn.openInEditor(optFn.jb_script + '/just_bun.ts');
        case '-o':
            return optFn.openInEditor(optFn.findPath());
        case '-L':
            isGlobal = true;
        case '-l':
            displayList = 'show';
            break;
        case '-N':
            isGlobal = true;
        case '-n':
            displayList = 'select';
            break;
        case '-f':
            args.shift();
            runnerPath = args.shift();
            if (!runnerPath)
                return optFn.err('File path not passed');
            if (!runnerPath.endsWith('.ts') || Bun.file(runnerPath).size === 0)
                return optFn.err('Incorrect file path');
            break;
        case '-g':
            args.shift();
            isGlobal = true;
    }
    if (!runnerPath) {
        runnerPath = (isGlobal ? optFn.jb_script + '/just_bun.ts' : optFn.findPath());
        if (!runnerPath)
            return optFn.err('Not found ↑ recipe file');
    }
    const { runRecipe }: { runRecipe: (recipeName: any, args?: string[]) => Promise<any> }
        = await import(path.resolve(runnerPath));

    if (!runRecipe)
        return optFn.err(`${runnerPath} does not contain export function runRecipe()`);

    if (displayList === 'show')
        return optFn.csl(`List of recipes in ${runnerPath}:\n${parseRecipes(runRecipe.toString())}`);

    if (displayList === 'select')
        return optFn.runByNumber(runRecipe);

    await runRecipe(args.shift(), args);
}

function printHelp() {
    optFn.csl('Help3');

}


