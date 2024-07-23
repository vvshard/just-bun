import path from "path";
import * as optFn from "./optionsFuncs";

export async function start(args: string[]) {
    let displayList = false;
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
            const fPath = optFn.findPath();
            return optFn.msg(`Path to recipe file: ${!fPath ? 'Not found ↑'
                :`./${path.relative(process.cwd(), fPath)} (${fPath})`
            }`);
        case '-O':
            return optFn.openInEditor(optFn.globalJB);
        case '-o':
            return optFn.openInEditor(optFn.findPath());
        //@ts-ignore
        case '-L':
            runnerPath = optFn.globalJB;
        case '-l':
            displayList = true;
            break;
        //@ts-ignore
        case '-lf':
            displayList = true;
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
    const { runRecipe }: { runRecipe: optFn.RunRecipe } = await import(path.resolve(runnerPath));
    if (!runRecipe)
        return optFn.err(`${reportPath} does not contain export function runRecipe()`);

    if (displayList) 
        return await optFn.runFromList(runRecipe, runnerPath);

    await runRecipe(args.shift(), args);
}

function printHelp() {
    optFn.msg('Help3');

}


