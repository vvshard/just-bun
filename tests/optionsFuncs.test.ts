import { expect, test, mock } from "bun:test";
import * as f from "../lib/optionsFuncs.ts";
import path from "path";


const defaultSettings = {
    notUpdate: false,
    editor: {
        fileOpen: 'code --goto %file%',
        fileOpenReport: false
    }
};

const cases = [
    [{}, defaultSettings],
    [{ notUpdate: true }, { ...defaultSettings, notUpdate: true }],
    [{ editor: { fileOpenReport: true } },
    {
        notUpdate: false,
        editor: {
            fileOpen: 'code --goto %file%',
            fileOpenReport: true
        }
    }
    ],
] as typeof defaultSettings[][];

test.each(cases)("getSettings() # %#", async (a, expected) => {
    expect((await f.getSettings(a))).toEqual(expected);
});


test("findPath() ../just_bun.ts", () => {
    const cwd = process.cwd();
    process.chdir('bun_script_alias/src');
    expect(f.findPath()).toBe(path.join(cwd, 'bun_script_alias/just_bun.ts'));
    process.chdir(cwd);
});

test("findPath() .Just_Bun.ts", () => {
    const cwd = process.cwd();
    process.chdir('tests');
    expect(f.findPath()).toBe(path.join(cwd, 'tests/.Just_Bun.ts'));
    process.chdir(cwd);
});


mock.module("../lib/optionsFuncs.ts", () => {
    return {
        settingsDir: path.resolve('jb_script/settings'),
        err: mock(),
        openInEditor: mock(),
    };
});

test("jbFromTemplate() is already", async () => {
    const cwd = process.cwd();
    process.chdir('tests');
    await f.jbFromTemplate();
    expect(f.err).lastCalledWith('There is already a file ".Just_Bun.ts" in the current directory');
    expect(f.openInEditor).lastCalledWith('.Just_Bun.ts');    
    process.chdir(cwd);
});

test("jbFromTemplate() tmplNameErr", async () => {
    //@ts-ignore
    f.err.mockClear(), f.openInEditor.mockClear();
    const cwd = process.cwd();
    process.chdir('bun_script_alias/src');
    await f.jbFromTemplate('tmplNameErr');
    expect(f.err).lastCalledWith('The template file matching the pattern "tmplNameErr*.ts" was not found.');
    expect(f.openInEditor).not.toBeCalled();    
    process.chdir(cwd);
});

