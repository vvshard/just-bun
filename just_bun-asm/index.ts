import path from "path";
import { $ } from "bun";

const jb_global = path.dirname(Bun.main);
const cwd = process.cwd();
const cl = (msg: string) => console.log('◇ ' + msg);
const clErr = (msg: string) => console.log('◆ ' + msg);

export async function start(args: string[]) {
    let isGlob = false;
    let displayList = false;

    switch (args[0]) {
        case '--help':
        case '-h':
            return printHelp();
        case '-t':
            return jb_from_template(args[1]);
        case '-@':
            return installTypes();
        case '-u':
            return mainupdate();
        case '-pg':
            return cl(`Path to global just_bun.js: ${jb_global}/`);
        case '-p':
            return cl(`Path to just_bun.js: ${findPath()}/`);
        case '-og':
            return openInEditor(jb_global);
        case '-o':
            return openInEditor(findPath());
        case '-lg':
            isGlob = true;
        case '-l':
            displayList = true;
            break;
        case '-g':
            isGlob = true;
    }

    let runnerPath = (isGlob ? jb_global : findPath());
    if (runnerPath === 'Not found ↑') return clErr(`${runnerPath} just_bun.js`);

    const { runRecipe }: { runRecipe: (recipeName: any, args?: string[]) => Promise<any> }
        = await import((runnerPath === '.' ? cwd : runnerPath) + '/just_bun.js');

    if (!runRecipe)
        return clErr(`${runnerPath}/just_bun.js does not contain function runRecipe()`);

    if (displayList)
        return cl(parseRecipes(runRecipe.toString()));

    if (isGlob) {
        args.shift();
    }
    await runRecipe(args.shift(), args);
}

function printHelp() {
    cl('Help3');

}

function findPath(file = 'just_bun.js'): string {
    let currentPath = '.';
    let parentPath = cwd;

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
        return clErr('Not found ↑ just_bun.js');
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
        return clErr('Not found ' + mainTs);
    await $`
bun i
bun build ./main.ts --outdir ../ --target bun`
        .cwd(jb_global + "/mainupdate");
}

function parseRecipes(sfun: string): string {
    return sfun;
}

async function jb_from_template(tmplName?: string) {
    if (Bun.file('just_bun.js').size !== 0) {
        cl('There is already a file just_bun.js in the current directory');
        openInEditor('.');
    } else {
        let t = await $`ls ${tmplName}*.js`.cwd(jb_global + '/templates').nothrow().text();
        t = t.split(/[\n\r]/)[0].trim();
        if (!t)
            return clErr(`A file matching the pattern "${tmplName}*.js"
                was not found in ${jb_global}/templates`);

        await Bun.write('./just_bun.js', Bun.file(`${jb_global}/templates/${t}`));
        await openInEditor('.');
    }
}

async function openInEditor(path: string) {
    if (path === 'Not found ↑')
        return clErr('Not found just_bun.js');

    const config = await Bun.file(jb_global + '/package.json').json();
    const openCommand: string | undefined = config.editor?.fileOpen;
    if (!openCommand)
        return clErr(`In ${jb_global}/package.json not specified editor.fileOpen`);

    const { stderr, exitCode } = path === '.'
        ? await $`${{ raw: openCommand.replace('%file%', './just_bun.js') }}`.nothrow()
        : await $`${{ raw: openCommand.replace('%file%', './just_bun.js') }}`.nothrow().cwd(path);
    if (exitCode !== 0) {
        clErr(`Error opening "just_bun.js":\n   ${stderr}`);
    }
}

