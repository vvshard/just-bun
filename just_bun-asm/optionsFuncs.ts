import path from "path";
import { $, Glob } from "bun";
import { parseRecipes } from "./parseRecipes";
/** Prints a message to the console with the appropriate label */
export const csl = (msg: string) => console.log('◇ ' + msg.replace('\n', '\n  '));
/** Prints a message to the console with the appropriate label */
export const err = (msg: string) => console.log('◆ ' + msg.replace('\n', '\n  '));
export const jb_global = path.dirname(Bun.main);

const config = await Bun.file(jb_global + '/package.json').json();
const cwd = process.cwd();
const jbPattern = '{.,}[jJ][uU][sS][tT]_[bB][uU][nN].ts';
const jbGlob = new Glob(jbPattern);
const ignoreGlob = new Glob('.gitignore');
// const templatesGlob = new Glob(`templates-${jbPattern}/`);

export function findPath(glob = jbGlob): string {
    let currentPath: string;
    let parentPath = cwd;

    do {
        const res = [...glob.scanSync({ cwd: parentPath, dot: true, absolute: true })][0];
        if (res)
            return res;
        currentPath = parentPath;
        parentPath = path.dirname(currentPath);
    } while (parentPath != currentPath);

    return 'Not found ↑';
}

export async function installTypes() {
    const jb_path = findPath();
    if (jb_path === 'Not found ↑')
        return err('Not found ↑ recipe file');
    let exist_gitignore = false;

    process.chdir(jb_path);
    if (Bun.file('./package.json').size === 0) {
        await $`bun add @types/bun --no-save; rm package.json`;
    } else {
        exist_gitignore = true;
        await $`bun add @types/bun -d`;
    }

    if (!exist_gitignore) {
        const gitignore_path = findPath(ignoreGlob);
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

export async function mainupdate() {
    const mainTs = jb_global + "/mainupdate/main.ts";
    if (Bun.file(mainTs).size === 0)
        return err('Not found ' + mainTs);
    await $`
bun i
bun build ./main.ts --outdir ../ --target bun
`.cwd(jb_global + "/mainupdate");
}

export async function jbFromTemplate(tmplName = '_') {
    const rcpFile = [...jbGlob.scanSync({ dot: true, absolute: true })][0];
    if (rcpFile) {
        err('There is already a file just_bun.ts in the current directory');
        openInEditor('.');
    } else {
        let t = await $`
        ls ${tmplName}*.mjs
        `.cwd(jb_global + '/templates').nothrow().text();
        t = t.split(/[\n\r]/)[0].trim();
        if (!t)
            return err(`A file matching the pattern "${tmplName}*.js"
                was not found in ${jb_global}/templates`);
        csl(`Template found: ${t}`);
        let text = await Bun.file(`${jb_global}/templates/${t}`).text();
        text = text.replace(/(?<=\bimport .+? from )['"].+?[\/\\]funcs\.mjs['"] *;?/g,
            JSON.stringify(jb_global + '/funcs.mjs') + ';');
        await Bun.write('./just_bun.ts', text);

        await openInEditor('.');
    }
}

export async function openInEditor(path: string) {
    if (path === 'Not found ↑')
        return err('Not found recipe file');

    const openCommand: string = config?.editor?.fileOpen ?? 'code --goto %file%';

    const { stderr, exitCode } = await $`${{ raw: openCommand.replace('%file%', path) }}`.nothrow();
    if (exitCode !== 0) {
        err(`Error opening recipe file:\n${stderr}`);
    }
}

export async function runByNumber(runRecipe: (recipeName: any, args?: string[]) => Promise<any>) {
    const listR = parseRecipes(runRecipe.toString()).split('\n');
    csl('Enter the recipe number and, if necessary, arguments:');
    console.log(listR.map((s, i) => `${i + 1}. ${s}`).join('\n'));
    for await (const line of console) {
        if (!line)
            return;
        const args = line.split(' ');
        const n = Math.floor(Number(args.shift()));
        if (isNaN(n)) {
            console.write('Enter the recipe NUMBER\n');
        } else if (n < 1 || n > listR.length) {
            console.write('Number outside the list\n');
        } else {
            let recipeName = listR[n - 1].split('/')[0].trim();
            if (recipeName === '<default>') {
                await runRecipe(undefined);
            } else {
                await runRecipe(recipeName, args);
            }
            return;
        }
    }
}
