import path from "path";
import { $ } from "bun";

const jb_global = path.dirname(Bun.main);

export async function start(args: string[]) {
    // console.log(`args: ${args}`);
    let isGlob = false;
    let displayList = false;
    let openInVsCode = false;

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
        case '-cg':
            isGlob = true;
        case '-c':
            openInVsCode = true;
            break;
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

    if (openInVsCode) {
        const { stderr, exitCode } = await $`code --goto ${runnerPath}`.nothrow();
        if (exitCode !== 0) {
            console.log(`Error opening "just_bun.js" in VS Code:\n   ${stderr}`);
        }
        return;
    }

    const { runRecipe }: { runRecipe: (recipeName: any, args?: string[]) => Promise<any> }
        = await import(runnerPath);

    if (!runRecipe)
        return console.log(`${runnerPath} does not contain function runRecipe()`);

    if (displayList)
        return console.log(parseRecipes(runRecipe.toString()));

    if (isGlob) {
        args.shift();
    }
    await runRecipe(args.shift(), args);
}

function printHelp() {
    console.log('Help3');

}

function findPath(file = 'just_bun.js', txt?: string[]): string {
    let currentPath = '.';
    let parentPath = process.cwd();

    do {
        if (Bun.file(`${parentPath}/${file}`).size !== 0)
            return currentPath === '.' ? '.' : parentPath;
        currentPath = parentPath;
        parentPath = path.dirname(currentPath);
    } while (parentPath != currentPath);

    return 'Not found ↑';
}

async function installTypes() {
    const jb_path = findPath();
    if (jb_path === 'Not found ↑')
        return console.log('Not found ↑ just_bun.js');
    let exist_gitignore = false;

    process.chdir(jb_path);
    if (Bun.file('./package.json').size === 0) {
        await $`bun add @types/bun --no-save; rm package.json`
    } else {
        exist_gitignore = true;
        await $`bun add @types/bun -d`
    }

    if (!exist_gitignore) {
        const gitignore_path = findPath('.gitignore');
        if (gitignore_path !== 'Not found ↑') {
            const file = Bun.file(gitignore_path + '/.gitignore');
            let gitignore_text = await file.text();
            if (gitignore_text.startsWith('node_modules/')
                || /\nnode_modules\//.test(gitignore_text)) {
                exist_gitignore = true;
            } else if (jb_path === '.') {
                await Bun.write(file, gitignore_text + '\nnode_modules/');
                exist_gitignore = true;
            }
        }
    }
    if (!exist_gitignore) {
        await Bun.write('./.gitignore', 'node_modules/');
    }
}

async function mainupdate() {
    const mainTs = jb_global + "/mainupdate/main.ts";
    if (Bun.file(mainTs).size === 0)
        return console.log("Not found " + mainTs);
    await $`
bun i
bun build ./main.ts --outdir ../ --target bun`
        .cwd(jb_global + "/mainupdate");
}

function parseRecipes(arg0: string): string {
    throw new Error("Function parseRecipes() not implemented.");
}

