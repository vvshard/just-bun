import path from "path";
import { $, Glob } from "bun";
import { parseRecipes } from "./parseRecipes";

/** Prints msg to the console with the appropriate label */
export const csl = (msg: string) => console.log('◇ ' + msg.replaceAll('\n', '\n  '));
/** Prints msg to the console with the appropriate label */
export const err = (msg: string) => console.log('◆ ' + msg.replaceAll('\n', '\n  '));
const mainDir = path.dirname(Bun.main);
export const globalJB = mainDir + '/just_bun.ts';

const jbPattern = '{.,}[jJ][uU][sS][tT]_[bB][uU][nN]';
const jbGlob = new Glob(jbPattern + '.ts');
const gitignoreGlob = new Glob('.gitignore');
let fileSettings = Bun.file(mainDir + '/settings.json');
const settings = !fileSettings.size ? undefined : await fileSettings.json();

export function findPath(glob = jbGlob): string | undefined {
    let currentPath: string;
    let parentPath = process.cwd();

    do {
        const res = glob.scanSync({ cwd: parentPath, dot: true, absolute: true }).next().value;
        if (res)
            return res;
        currentPath = parentPath;
        parentPath = path.dirname(currentPath);
    } while (parentPath != currentPath);

    return undefined;
}

export async function installTypes() {
    let jb_path = findPath();
    if (jb_path) {
        process.chdir(path.dirname(jb_path));
    }
    let no_gitignore = !Bun.file('./package.json').size;
    if (no_gitignore) {
        csl('$ bun add @types/bun --no-save');
        await $`bun add @types/bun --no-save`;
        if (Bun.file('./package.json').size) {
            await $`rm package.json`;
        }
        const gitignore_path = findPath(gitignoreGlob);
        if (gitignore_path) {
            const file = Bun.file(gitignore_path);
            let gitignore_text = await file.text();
            if (gitignore_text.startsWith('node_modules/')
                || /\nnode_modules\//.test(gitignore_text)) {
                no_gitignore = false;
            } else if (path.relative(process.cwd(), gitignore_path) === '.gitignore') {
                await Bun.write(file, gitignore_text + '\nnode_modules/');
                no_gitignore = false;
            }
        }
        if (no_gitignore) {
            await Bun.write('./.gitignore', 'node_modules/');
        }
    } else {
        csl('bun add @types/bun -d');
        await $`bun add @types/bun -d`;
    }
}

export async function mainupdate() {
    const mainTs = mainDir + "/mainupdate/main.ts";
    if (Bun.file(mainTs).size === 0)
        return err('Not found ' + mainTs);
    await $`
bun i
bun build ./main.ts --outdir ../ --target bun
`.cwd(mainDir + "/mainupdate");
}

export async function jbFromTemplate(tmplName = '_') {
    const rcpFile = jbGlob.scanSync({ dot: true }).next().value;
    if (rcpFile) {
        err(`There is already a file "${rcpFile}" in the current directory`);
        openInEditor(rcpFile);
    } else {
        const glob = new Glob(`templates-${jbPattern}/${tmplName}*.ts`);
        const tmpltPath = glob.scanSync({ cwd: mainDir, dot: true, absolute: true }).next().value;
        if (!tmpltPath)
            return err(`The template file matching the pattern "${tmplName}*.ts" was not found.`);

        csl(`Template found: ${tmpltPath}`);
        let text = await Bun.file(`${tmpltPath}`).text();
        text = text.replace(/(?<=\bimport .+? from )['"].+?[\/\\]funcs\.ts['"] *;?/g,
            JSON.stringify(mainDir + '/funcs.ts') + ';');
        const jbName = path.basename(path.dirname(tmpltPath)).slice(10) + '.ts';
        await Bun.write(jbName, text);

        await openInEditor(jbName);
    }
}

export async function openInEditor(file?: string) {
    if (!file)
        return err('Not found recipe file');
    const openCommand: string = (settings?.editor?.fileOpen ?? 'code --goto %file%')
    .replace('%file%', `"${file}"`);
    if (settings?.editor?.fileOpenReport) {
        csl(openCommand !== 'none' ? '$ ' + openCommand
            : `File opening disabled in ${mainDir}/settings.json:\n "editor"/"fileOpen": "none"`
        );
    }
    if (openCommand === 'none')
        return;
    const { stderr, exitCode } = await $`${{ raw: openCommand }}`.nothrow();
    if (exitCode !== 0) {
        err(`Error opening recipe file:\n${stderr}`);
    }
}

export async function runByNumber(runRecipe: (recipeName: any, args?: string[]) => any) {
    const listR = parseRecipes(runRecipe).split('\n');
    csl('Enter the recipe number and, if necessary, arguments:\n'
        + listR.map((s, i) => `${i + 1}. ${s}`).join('\n'));
    for await (const line of console) {
        if (!line)
            return csl('Reset');
        const args = line.split(' ');
        const n = Math.floor(Number(args.shift()));
        if (isNaN(n)) {
            console.write('Enter the recipe NUMBER\n');
        } else if (n < 1 || n > listR.length) {
            console.write('Number outside the list\n');
        } else {
            let recipeName = listR[n - 1].split(' ', 1)[0];
            if (recipeName === '<default>') {
                await runRecipe(undefined);
            } else {
                await runRecipe(recipeName, args);
            }
            return;
        }
    }
}
