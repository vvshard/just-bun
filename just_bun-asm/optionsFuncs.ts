import path from "path";
import { $, Glob } from "bun";
import { parseRecipes } from "./parseRecipes";

export type RunRecipe = (recipeName?: string, args?: string[]) => any

/** Prints message to the console with the appropriate label */
export const msg = (message: string) => console.log('◇ ' + message.replaceAll('\n', '\n  '));
/** Prints message to the console with the appropriate label */
export const err = (message: string) => console.log('◆ ' + message.replaceAll('\n', '\n  '));
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
        msg('$ bun add @types/bun --no-save');
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
        msg('bun add @types/bun -d');
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

        msg(`Template found: ${tmpltPath}`);
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
        msg(openCommand !== 'none' ? '$ ' + openCommand
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

export async function runFromList(runRecipe: RunRecipe, runnerPath: string) {
    const rPath = runnerPath === globalJB ? globalJB
        : `./${path.relative(process.cwd(), runnerPath)} (${path.resolve(runnerPath)})`;
    const list = parseRecipes(runRecipe);
    if (!list.length)
        return err(`No recipes found in file ${rPath}`);
    const listS = list.map((a, i) => `${i + 1}. ${a.join(' | ')}`).join('\n');
    msg(`List of recipes in ${rPath}):\n${listS}`);
    const lisnNames = list.flat().filter(s => !s.startsWith(' #'));
    msg('Enter: ( <recipe number> | <recipe name> | <alias> ) [args]. Cancel: CTRL + C | `<Enter>');
    console.write('◇ : ');
    for await (const line of console) {
        if (line === '`')
            return msg('Reset');
        const args = line.trimStart().split(/ +/);
        let recipeName = args.shift() || '<default>';
        const n = Math.floor(Number(recipeName));
        if (!isNaN(n) && n > 0) {
            if (n > list.length) {
                console.write('◇ Number outside the list\n◇ : ');
                continue;
            } else {
                recipeName = lisnNames[n - 1];
            }
        } else if (!lisnNames.includes(recipeName)) {
            console.write('◇ Wrong recipe name\n◇ : ');
            continue;
        }
        if (recipeName === '<default>')
            return await runRecipe(undefined);

        return await runRecipe(recipeName, args);
    }
}
