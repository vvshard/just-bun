import path from "path";
import { parseRecipes } from "./parseRecipes";
import * as optFn from "./optionsFuncs";

export async function start(args: string[]) {
    let displayList: 'show' | 'select' | undefined;
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
            return optFn.msg(`Path to global recipe file: ${optFn.globalJB}`);
        case '-p':
            return optFn.msg(`Path to recipe file: ${optFn.findPath() ?? 'Not found ↑'}`);
        case '-O':
            return optFn.openInEditor(optFn.globalJB);
        case '-o':
            return optFn.openInEditor(optFn.findPath());
        //@ts-ignore
        case '-L':
            runnerPath = optFn.globalJB;
        case '-l':
            displayList = 'show';
            break;
        //@ts-ignore
        case '-N':
            runnerPath = optFn.globalJB;
        case '-n':
            displayList = 'select';
            break;
        //@ts-ignore
        case '-nf':
            displayList = 'select';
        case '-f':
            args.shift();
            runnerPath = args.shift();
            if (!runnerPath)
                return optFn.err('File path not passed');
            if (!runnerPath.endsWith('.ts'))
                return optFn.err('Incorrect file path');
            break;
        case '-g':
            args.shift();
            runnerPath = optFn.globalJB;
            break;
        default:
    }
    let reportPath = runnerPath;
    if (!runnerPath) {
        runnerPath = optFn.findPath();
        if (!runnerPath)
            return optFn.err('Not found ↑ recipe file');
        reportPath = './' + path.relative(process.cwd(), runnerPath);
    } else {
        if (!Bun.file(runnerPath).size)
            return optFn.err(`Not found ${runnerPath}`);
    }
    const { runRecipe }: { runRecipe: (recipeName?: string, args?: string[]) => any }
        = await import(path.resolve(runnerPath));
    if (!runRecipe)
        return optFn.err(`${reportPath} does not contain export function runRecipe()`);

    switch (displayList) {
        case undefined:
            return await runRecipe(args.shift(), args);
        case 'select':
            return await optFn.runByNumber(runRecipe);
        case 'show':
            optFn.msg(`List of recipes in ${reportPath}:\n${parseRecipes(runRecipe)}`);
    }
}

function printHelp() {
    optFn.msg('Help3');

}


