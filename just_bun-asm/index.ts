import path from "path";
import * as optFn from "./optionsFuncs";

export async function start(args: string[]) {
    if (!globalThis.Bun)
        return console.log('This script should be run in a Bun');
    if (Bun.version.split('.').reduce((a, n) => a * 1000 + +n, 0) < 1_001_019)
        return optFn.err('Version Bun must be at least 1.1.19');
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
                : `./${path.relative(process.cwd(), fPath)} (${fPath})`
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
    optFn.msg(`$ bun run "${Bun.main}": script - recipe launcher "just-bun"

Command Line Format variants (jb - alias for "bun <path>/${path.basename(Bun.main)}"):   
  * jb [-g] [<recipeName> [args]]   # main use
  * jb -f <path/to/recipe/file>.ts [<recipeName> [args]]
  * jb -t [<templateSearchLine>]
  * jb -lf <path/to/recipe/file>.ts
  * jb <flag>

Flags:
  * -g  runs a recipe from the global recipe file located in the main.js folder. Without the -g flag, 
         the recipe file is searched in the current directory and up the chain of parent directories
  * -f  runs a recipe from any .ts-file specified in \<path/to/recipe/file>
  * -t  creates a new recipe file in the current folder based on the template 
         [found]() by the first characters specified in \<templateSearchLine> 
  * -l  shows the path and numbered list of recipes for the current folder and offers 
         to run the recipe by indicating its number | name | alias and [args]
  * -L  is the same as -l, but for a global recipe file
  * -lf is the same as -l, but for the file \<path/to/recipe/file>.ts
  * -o  [opens]() the current recipe file in the editor
  * -O  [opens]() the global recipe file in the editor
  * -p  prints relative and absolute path to the current recipe file
  * -P  prints the absolute path to the global recipe file
  * -@  installs/updates node_modules/ c @types/bun in the folder of the current recipe file, 
         if it doesn't find it, then in the current folder
  * -u [updates]() main.js from the internet
  * -h, --help  displays help on format command line and flags`);
}


