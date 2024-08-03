# just-bun

This allows you to use the [Bun Shell](https://bun.sh/docs/runtime/shell) to save and run project-specific commands, 
similar to [just](https://github.com/casey/just).    
The main advantage over just is that Bun Shell seamlessly strings shell commands onto arbitrarily sophisticated 
logic written in TypeScript with powerful Bun-API tools, including almost the entire Node.js-API.

## Content

* [Usage example](#usage-example)
* [Installation](#installation)
* [Command line format and flags](#command-line-format-and-flags)
* [Function runRecipe() syntax restrictions](#function-runrecipe-syntax-restrictions)
* [Contents of the jb_script/settings folder](#contents-of-the-jb_scriptsettings-folder)
* [Unpleasant features of Bun Shell and ways to work around them](#unpleasant-features-of-bun-shell-and-ways-to-work-around-them)


## Usage example

Recipes are stored in just_bun.ts files in the arms of the `switch(recipeName)` of function     
`export async function runRecipe(recipeName?: string, args = [])`.    
Example just_bun.ts file:
```ts
import { $ } from "bun";

export async function runRecipe(recipeName?: string, args = []) {
    switch (recipeName) {
        case 'run':     // recipeName
        case 'r':       // recipeName alias
        case undefined: // default: for run without recipeName
            await $`cargo run`;
            break;
        case 'build_release':
        case 'b':
            await $`cargo build --release`;
            await $`echo "Result in: ${__dirname}/target/release"`;
            break;
        case 'test':
        case '# args: [filter] [-nThreads] // e.g.: -1 - in one thread': // comment for list
        case 't':
            await $`cargo test ${{raw: args.join(' ').replace('-', '-- --test-threads=')}}`;
            break;
        default:
            return console.log(`recipeName error: '${recipeName}'`);
    }
}
```
Now, in the directory containing this just_bun.ts or in its child directory, the terminal command `jb -l` will output:
```
◇ List of recipes in ./just_bun.ts (<absolute path>/just_bun.ts):
  1. run | r | <default> 
  2. build_release | b 
  3. test | t # args: [filter] [-nThreads] // e.g.: -1 - in one thread
◇ Enter: ( <number> | <name> | <alias> ) [args]. Cancel: <Space>
> ▮
```
Typing `1` or `run` or `r` or just `<Enter>` at the prompt will do: `cargo run`.    
And, for example, typing `3 -1` or `t -1` will produce: `cargo test -- --test-threads=1`.

The same result can be obtained without `jb -l` by calling directly in the shell:    
`jb run` or `jb r` or just `jb` - for `cargo run`    
or `jb t -1` - for `cargo test -- --test-threads=1`.

If you prefer, the recipe file name can have a dot in front and any letter case before the extension.   
For example, `Just_Bun.ts` and `.JUST_BUN.ts` are valid names.

[Read more about the limitations of the **function runRecipe()** syntax below](#function-runrecipe-syntax-restrictions).

[More information about syntax and working with **Bun Shell** - follow the link](https://bun.sh/docs/runtime/shell). 

## Installation

1.  Install [Bun](https://bun.sh/) if it is not already on your system.
2.  Run in terminal in ~/.bun/ directory in bash:
    ```bash
    $ mkdir jb_script; cd jb_script; bun i just-bun
    $ mv -f -t ./ ./node_modules/just-bun/jb_script/**
    ```
    or in PowerShell:
    ```powershell
    PS> mkdir jb_script; cd jb_script; bun i just-bun
    PS> mv -force ./node_modules/just-bun/jb_script/** ./
    ```
    This will create a jb_script folder with the main.js startup script, a settings subfolder for user settings, 
    and install just-bun in node_modules.
3.  Create a short, convenient alias for your main shell's     
    `bun <absolute path to jb_script>/main.js` command. Here I will denote this alias `jb`. 
    ___   
    If you have [Rust](https://www.rust-lang.org/) installed on your system, instead of creating aliases 
    in your shells, you can compile the jb executable (jb.exe for Windows) from the bun_script_alias folder 
    of the [repository](https://github.com/vvshard/just-bun) and place it in the ~/.bun/bin/ folder. 
    The only thing it does is call     
    `bun ~/.bun/jb_script/main.js` with the arguments passed to it.    
    If desired, you can synchronously rename the runner file and the folder to a more convenient name for calling, 
    for example - in **j** (**j.exe** for Windows) and **j_script**/ respectively.
    ___ 
4.  At this point everything works, but your code editor requires @types/bun declarations for 
    autocompletion and type checking from the Bun-API when editing recipe files.   
    To do this, go to in the terminal in the root directory of the projects in which you will use 
    the recipe files, and enter `jb -@`. This will create/update a node_modules/ folder here with @types/bun declarations.

## Command line format and flags

This section can also be read using the command `jb -h` or `jb --help`

Command Line Format variants:   
  * `jb [-g] [<recipeName> [args]]`   # main use
  * `jb -f <path/to/recipe/file>.ts [<recipeName> [args]]`
  * `jb -t [<templateSearchLine>]`
  * `jb -lf <path/to/recipe/file>.ts`
  * `jb <flag>`

Flags:
  * `-g` runs a recipe from the global recipe file located in the settings folder. Without the -g flag,
        the recipe file is searched in the current directory and up the chain of parent directories
  * `-f` runs a recipe from any .ts-file specified in \<path/to/recipe/file>
  * `-t` creates a new recipe file in the current folder based on the template 
        [found](#templates-just_bun-folder) by the first characters specified in \<templateSearchLine> 
  * `-l` shows the path and numbered list of recipes for the current folder and offers 
        to run the recipe by indicating its number | name | alias and [args]
  * `-L` is the same as `-l`, but for a global recipe file
  * `-lf` is the same as `-l`, but for the file \<path/to/recipe/file>.ts
  * `-o` [opens](#settingsjson) the current recipe file in the editor
  * `-O` [opens](#settingsjson) the global recipe file in the editor
  * `-p` prints relative and absolute path to the current recipe file
  * `-P` prints the absolute path to the global recipe file
  * `-@` installs/updates node_modules/ with @types/bun in the folder of the current recipe file, 
        if it doesn't find it, then in the current folder
  * `-i` checks and corrects the absolute import path to funcs.ts in the current recipes file
  * `-u` update just-bun to latest version
  * `-h`, `--help` displays help on format command line and flags

## Function runRecipe() syntax restrictions

These restrictions are imposed solely for the correct display of the list of recipes 
displayed using the `-l`, `-L`, `-lf` flags:

The list of recipes is formed according to the text of the first switch statement from recipeName:
`switch (recipeName) {...}` and the restrictions apply only to this statement:
1.  All `case` expressions must be string literals without line breaks. 
    Only one `case` is allowed per entire switch statement with an *undefined* literal for the default recipe.
2.  A chain of several `cases` before a common branch of operations is:
    * optional recipe comments: `case` starting with "#"
    * required recipe name: first `case` - is not a comment
    * optional recipe aliases

    `case` - comments can be anywhere in the chain.      
    Such a recipe is displayed in the list in one line: at the beginning - the name of the recipe 
    and its aliases separated by ` | `, and at the end - the first comment of the recipe (if any).
    The remaining recipe comments, if any, are displayed as additional lines in the column of first  comment .      
    A `case` with the value `undefined` is listed as `<default>` and can be either 
    an alias or the first or only `case` in the chain.

## Contents of the jb_script/settings/ folder

#### just_bun.ts

This is a global recipe file, called from any working directory with the `-g`, `-L`, `-O`, `-P` flags.   
Used for custom recipes common to all projects. Unlike current recipe files, 
its name must be strictly "just_bun.ts": without a dot at the beginning of the name and in lower case.

#### settings.json

This is an optional file of user settings that differ from the default values:
* **notUpdate** - false by default: disables updating on accidental input of the `-u` flag
* **editor** section:
    * **fileOpen** - command line for opening a file in the editor (by default - for VS Code: "code --goto %file%").   
    If you want to generally prohibit the opening of files using the `-o`, `-O` flags and those newly 
    created from templates using the `-t` flag,
    The value of this parameter should be set to "none".
    * **fileOpenReport** - whether it is necessary to announce in the console about the transmitted 
    command to open a file or about prohibiting fileOpen = "none" (default - false).

#### funcs.ts

This is a module containing exportable user constants and functions used in any recipe files.
The exported functions initially written in it are used in the starting templates of recipe files 
from the templates-just_bun/ folder.

#### templates-just_bun/ folder

Contains custom recipe file templates. They will be called by the first characters of the name 
with the command `jb -t [<templateSearchLine>]`. If the <templateSearchLine> argument is not passed, 
the _.ts template will be used   

If you want recipe files newly created using templates to have a dot  at the beginning of the name 
or were non-lower case, replace the ending of the name of this directory "just_bun" with 
the required one (for example, to create .JUST_BUN.ts files, the directory name should be "templates-.JUST_BUN" ).

For portability, templates import funcs.ts at a relative path. 
But in newly created recipe files based on them, this path will be replaced with the actual absolute one.

## Unpleasant features of Bun Shell and ways to work around them

Some of the below is waiting to be resolved in [bun/issues](https://github.com/oven-sh/bun/issues), 
but for now you can use the following solutions:

#### ```$`...` ``` lacks the option to output an interpolated command to the console

While there are a number of useful options, such as ```$`...`.cwd(<path>) ```, which sets the working 
directory for the command etc., the main Bun Shell function does not have the option to pre-print 
the interpolated command to the console, which is often desirable to see when starting recipes.

**Solution:**  
You can use a custom function in funcs.ts that decorates ```$`...` ``` appropriately.
This is precisely the purpose that the ```function p$()``` originally written in funcs.ts serves, 
which is called in the same way: ```p$`...` ```, prints an interpolation of the command 
close to `$` and then passes the call to `$`. Examples of using `p$` can be found in the templates.

#### Working with sh/bash utilities

For full cross-platform compatibility, [Bun Shell implements a set of built-in commands with the names of popular shell utilities](https://bun.sh/docs/runtime/shell#builtin-commands). 
However, so far, not all of them fully support all flags and options of shell utilities.

**Solution:**   
The best way, if necessary, to call a utility from Bun Shell rather than a built-in command is to 
create an exported constant in funcs.ts, for example named "SH" with the absolute path to 
the location of your sh / bash utilities. For example, on Windows, this most likely it will be:   
`export const SH = "C:/Program Files/Git/usr/bin/";`    
Then, for example, if you are not satisfied with the work of the built-in command `ls`, 
by importing `SH` into the recipe file, you can replace the call to the built-in command    
```await $`ls` ```, by calling a similar utility:    
```await $`${SH}ls` ```

#### Auto-encoding non-ASCII characters to \uXXXX of parameters and paths entered in ```$`...` ``` 
For example, the command    
```await $`echo "▶ - play, ■ - stop"` ``` will output to the console:   
`\u25B6 - play, \u25A0 - stop`    

```await $`${SH}echo ...` ``` doesn't help either - it's not the command, but the interpreter

**Solution:**    
Pass parameters and paths containing non-ASCII characters as variables and expressions for interpolation:    
```await $`echo ${"▶ - play, ■ - stop"}` ``` will output to the console:    
`▶ - play, ■ - stop`    
