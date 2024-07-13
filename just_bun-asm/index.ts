import path from "path";
import { $ } from "bun";
// import { cl.nrm, cl.err } from "../jb_global/funcs.mjs";
const cwd = process.cwd();
const jb_global = path.dirname(Bun.main);
/** Prints a message to the console with the appropriate label */
type Cl = (msg: string) => void;
const { cl }: { cl: { nrm: Cl, err: Cl } } = await import(jb_global + '/funcs.mjs');
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
            return cl.nrm(`Path to global +justbun.mjs: ${jb_global}/`);
        case '-p':
            return cl.nrm(`Path to +justbun.mjs: ${findPath()}/`);
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
    if (runnerPath === 'Not found ↑') return cl.err(`${runnerPath} +justbun.mjs`);

    const { runRecipe }: { runRecipe: (recipeName: any, args?: string[]) => Promise<any> }
        = await import((runnerPath === '.' ? cwd : runnerPath) + '/+justbun.mjs');

    if (!runRecipe)
        return cl.err(`${runnerPath}/+justbun.mjs does not contain function runRecipe()`);

    if (displayList)
        return cl.nrm(parseRecipes(runRecipe.toString()));

    if (isGlob) {
        args.shift();
    }
    runRecipe(args.shift(), args);
}

function printHelp() {
    cl.nrm('Help3');

}

function findPath(file = '+justbun.mjs'): string {
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
        return cl.err('Not found ↑ +justbun.mjs');
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
        return cl.err('Not found ' + mainTs);
    await $`
bun i
bun build ./main.ts --outdir ../ --target bun
`.cwd(jb_global + "/mainupdate");
}

function parseRecipes(sfun: string): string {
    return sfun;
}

async function jb_from_template(tmplName = '_') {
    if (Bun.file('+justbun.mjs').size !== 0) {
        cl.nrm('There is already a file +justbun.mjs in the current directory');
        openInEditor('.');
    } else {
        let t = await $`
        ls ${tmplName}*.mjs
        `.cwd(jb_global + '/templates').nothrow().text();
        t = t.split(/[\n\r]/)[0].trim();
        if (!t)
            return cl.err(`A file matching the pattern "${tmplName}*.js"
                was not found in ${jb_global}/templates`);

        await Bun.write('./+justbun.mjs', Bun.file(`${jb_global}/templates/${t}`));
        await openInEditor('.');
    }
}

async function openInEditor(path: string) {
    if (path === 'Not found ↑')
        return cl.err('Not found +justbun.mjs');

    const config = await Bun.file(jb_global + '/package.json').json();
    const openCommand: string | undefined = config.editor?.fileOpen;
    if (!openCommand)
        return cl.err(`In ${jb_global}/package.json not specified editor.fileOpen`);

    const { stderr, exitCode } = path === '.'
        ? await $`${{ raw: openCommand.replace('%file%', './+justbun.mjs') }}`.nothrow()
        : await $`${{ raw: openCommand.replace('%file%', './+justbun.mjs') }}`.nothrow().cwd(path);
    if (exitCode !== 0) {
        cl.err(`Error opening "+justbun.mjs":\n   ${stderr}`);
    }
}

