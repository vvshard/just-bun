import path from "path";
import { $, Glob } from "bun";
import { parseRecipes } from "./parseRecipes";

export type RunRecipe = (recipeName?: string, args?: string[]) => any

/** Prints message to the console with the appropriate label */
export const msg = (message: string) => console.log('◇ ' + message.replaceAll('\n', '\n  '));
/** Prints message to the console with the appropriate label */
export const err = (message: string) => console.log('◆ ' + message.replaceAll('\n', '\n  '));
export const settingsDir = path.join(path.dirname(Bun.main), 'settings');
export const globalJB = path.join(settingsDir, 'just_bun.ts');

const importFuncsPath = JSON.stringify(path.join(settingsDir, 'funcs.ts'));
const jbPattern = '{.,}[jJ][uU][sS][tT]_[bB][uU][nN]';
const jbGlob = new Glob(jbPattern + '.ts');
const gitignoreGlob = new Glob('.gitignore');

// A two-level settings structure is assumed, with no default null values.
export async function getSettings(jsonSettings?: any) {
    const defaultSettings = {
        notUpdate: false,
        editor: {
            fileOpen: 'code --goto %file%',
            fileOpenReport: false
        }
    };
    if (!jsonSettings) {
        const settingsFile = Bun.file(path.join(settingsDir, 'settings.json'));
        if (!settingsFile.size)
            return defaultSettings;
        jsonSettings = await settingsFile.json();
    }
    const asObject = (a: any) => typeof a === 'object' && !Array.isArray(a) ? a : null;
    if (!asObject(jsonSettings))
        return defaultSettings;
    for (const key in defaultSettings) {
        const dfltValue = (<{ [index: string]: any }>defaultSettings)[key];
        if (asObject(dfltValue)) {
            jsonSettings[key] = { ...dfltValue, ...asObject(jsonSettings[key]) };
        }
    }
    return <typeof defaultSettings>{ ...defaultSettings, ...jsonSettings };
}

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

export async function jbUpdate() {
    if (!(await getSettings()).notUpdate) {
        await $`bun update`.cwd(path.dirname(settingsDir));
    }
}

export async function jbFromTemplate(tmplName = '_') {
    const rcpFile = jbGlob.scanSync({ dot: true }).next().value;
    if (rcpFile) {
        err(`There is already a file "${rcpFile}" in the current directory`);
        await openInEditor(rcpFile);
    } else {
        const glob = new Glob(`templates-${jbPattern}/${tmplName}*.ts`);
        const tmpltPath = glob.scanSync({ cwd: settingsDir, dot: true, absolute: true }).next().value;
        if (!tmpltPath)
            return err(`The template file matching the pattern "${tmplName}*.ts" was not found.`);

        msg(`Template found: ${path.basename(tmpltPath)}`);
        const jbName = path.basename(path.dirname(tmpltPath)).slice(10) + '.ts';
        await Bun.write(jbName, Bun.file(`${tmpltPath}`));
        await checkImportFuncs(path.resolve(jbName));

        await openInEditor(jbName);
    }
}

/** Returns Promise<false> if no correction was required. */
async function checkImportFuncs(jbPath: string): Promise<boolean> {
    const file = Bun.file(`${jbPath}`);
    const text = await file.text();
    const text2 = text.replace(/(?<=\bimport .+? from )['"].+?[\/\\]funcs\.ts['"] *;?/g,
        importFuncsPath + ';');
    if (text2 === text)
        return false;
    await Bun.write(file, text2);
    return true;
}

export async function checkImportFuncsAll() {
    const glob = new Glob(`**/${jbPattern}.ts`);
    const paths = [...glob.scanSync({ dot: true, absolute: true })];
    paths.sort();
    const jbPath = findPath();
    if (jbPath && path.relative(process.cwd(), jbPath).startsWith('..')) {
        paths.unshift(jbPath);
    }
    const corrected: string[] = [`files the import was corrected to ${importFuncsPath}:`];
    const notRequired: string[] = ["files:"];
    const cwd = process.cwd();
    for (const jbPath of paths) {
        (await checkImportFuncs(jbPath) ? corrected : notRequired).push(path.relative(cwd, jbPath));
    }
    msg(`In ${corrected.length - 1} ${corrected.join('\n')}`);
    msg(`No corrections were required in ${notRequired.length - 1} ${notRequired.join('\n')}`);
}

export async function openInEditor(file?: string) {
    if (!file)
        return err('Not found recipe file');
    const settings = await getSettings();
    const openCommand: string = settings.editor.fileOpen.replace('%file%', `"${file}"`);
    if (settings.editor.fileOpenReport) {
        msg(openCommand !== 'none' ? '$ ' + openCommand
            : `File opening disabled in ${path.join(settingsDir, 'settings.json')}:
 "editor"."fileOpen": "none"`);
    }
    if (openCommand === 'none')
        return;

    const { stderr, exitCode } = await $`${{ raw: openCommand }} `.nothrow();
    if (exitCode !== 0) {
        err(`Error opening recipe file: \n${stderr} `);
    }
}

export async function runFromList(runRecipe: RunRecipe, runnerPath: string) {
    const rPath = runnerPath === globalJB ? globalJB
        : `./ ${path.relative(process.cwd(), runnerPath)} (${path.resolve(runnerPath)})`;
    const list = parseRecipes(runRecipe);
    if (!list.length)
        return err(`No recipes found in file ${rPath} `);
    const listS = list.map(([aliases, comments], i) => {
        let res = `${i + 1}. ${aliases.join(' | ')} `;
        return res + comments.join('\n' + ' '.repeat(Bun.stringWidth(res)));
    }).join('\n');
    msg(`List of recipes in ${rPath}): \n${listS} `);
    msg('Enter: ( <number> | <name> | <alias> ) [args]. Cancel: <Space>');
    const listNames = list.flatMap(([aliases, comments]) => aliases);
    console.write('> ');
    for await (const line of console) {
        if (line.startsWith(' ') && !line.trim())
            return msg('Cancel');

        const args = line.trimStart().split(/ +/);
        let recipeName = args.shift() || '<default>';
        const n = Math.floor(Number(recipeName));
        if (!isNaN(n) && n > 0) {
            if (n > list.length) {
                console.write('◇ Number outside the list\n> ');
                continue;
            } else {
                recipeName = list[n - 1][0][0];
            }
        } else if (!listNames.includes(recipeName)) {
            console.write('◇ Wrong recipe name\n> ');
            continue;
        }
        if (recipeName === '<default>')
            return await runRecipe(undefined);

        return await runRecipe(recipeName, args);
    }
}

