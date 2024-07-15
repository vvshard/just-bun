import path from "path";
import { parseRecipes } from "./parseRecipes";
import * as optFn from "./optionsFuncs";
export const jb_global = path.dirname(Bun.main);
/** Prints a message to the console with the appropriate label */
type Csl = (msg: string) => void;
export const { csl, err }: { csl: Csl, err: Csl } = await import(jb_global + '/funcs.mjs');

export async function start(args: string[]) {
    let isGlob = false;
    let displayList: 'none' | 'show' | 'select' = 'none';
    let runnerPath = "";

    switch (args[0]) {
        case '--help':
        case '-h':
            return printHelp();
        case '-t':
            return optFn.jb_from_template(args[1]);
        case '-@':
            return optFn.installTypes();
        case '-u':
            return optFn.mainupdate();
        case '-P':
            return csl(`Path to global just_bun.mjs: ${jb_global}/`);
        case '-p':
            return csl(`Path to just_bun.mjs: ${optFn.findPath()}/`);
        case '-O':
            return optFn.openInEditor(jb_global);
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
                return err('File path not passed');
            if (Bun.file(runnerPath).size === 0 || !runnerPath.endsWith('js'))
                return err('Incorrect file path');
            break;
        case '-g':
            args.shift();
            isGlob = true;
    }
    if (!runnerPath) {
        runnerPath = (isGlob ? jb_global : optFn.findPath());
        if (runnerPath === 'Not found ↑')
            return err('Not found ↑ just_bun.mjs');
        runnerPath += '/just_bun.mjs';
    }
    const { runRecipe }: { runRecipe: (recipeName: any, args?: string[]) => Promise<any> }
        = await import(path.resolve(runnerPath));

    if (!runRecipe)
        return err(`${runnerPath} does not contain function runRecipe()`);

    if (displayList === 'show')
        return csl(`List of recipes in ${runnerPath}: \n${parseRecipes(runRecipe.toString())}`);

    if (displayList === 'select')
        return optFn.runByNumber(runRecipe);

    await runRecipe(args.shift(), args);
}

function printHelp() {
    csl('Help3');

}


