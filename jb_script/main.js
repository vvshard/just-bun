// @bun
// ../../../code/JS/Bun/just-bun/just_bun-asm/index.ts
import path2 from "path";

// ../../../code/JS/Bun/just-bun/just_bun-asm/optionsFuncs.ts
import path from "path";
var {$, Glob } = globalThis.Bun;

// ../../../code/JS/Bun/just-bun/just_bun-asm/parseRecipes.ts
function parseRecipes(fun) {
  const sfun = fun.toString();
  const iSwitch = sfun.search(/\bswitch \(recipeName\) \{/);
  if (iSwitch === -1)
    return [];
  const re = /\b(?<case_>case) ('(?<name1>(?:\\'|[^'])*)'|"(?<name2>(?:\\"|[^"])*)"|void 0):|\bbreak\b|\breturn\b|(?<!\\)(?<token>\$\{|[}'"`\{])/g;
  const stack = ["MAIN"];
  const list = [];
  let aliases = [];
  let comment = "";
  const matches = sfun.slice(iSwitch + 21).matchAll(re);
  for (const match of matches) {
    const { case_, name1, name2, token: token0 } = match.groups;
    const token = token0 ?? case_ ?? "break_return";
    const state = stack.at(-1);
    switch (state) {
      case "MAIN":
        switch (token) {
          case "case":
            const name = name1 ?? name2;
            if (name?.startsWith("#")) {
              comment += " " + name;
            } else {
              aliases.push(name ?? "<default>");
            }
            break;
          case "break_return":
          case "}":
            if (aliases.length) {
              if (comment) {
                aliases.push(JSON.parse(`"${comment.replaceAll('"', '\\"')}"`));
              }
              list.push(aliases);
            }
            if (token === "}")
              return list;
            aliases = [];
            comment = "";
            break;
          default:
            stack.push(token);
        }
        break;
      case "`":
        if (token === "${") {
          stack.push("{");
          break;
        }
      case "\'":
      case '"':
        if (token === state) {
          stack.pop();
        }
        break;
      case "{":
        if (token === "}") {
          stack.pop();
        } else if (token === token0) {
          stack.push(token);
        }
    }
  }
  return list;
}

// ../../../code/JS/Bun/just-bun/just_bun-asm/optionsFuncs.ts
function findPath(glob = jbGlob) {
  let currentPath;
  let parentPath = process.cwd();
  do {
    const res = glob.scanSync({ cwd: parentPath, dot: true, absolute: true }).next().value;
    if (res)
      return res;
    currentPath = parentPath;
    parentPath = path.dirname(currentPath);
  } while (parentPath != currentPath);
  return;
}
async function installTypes() {
  let jb_path = findPath();
  if (jb_path) {
    process.chdir(path.dirname(jb_path));
  }
  let no_gitignore = !Bun.file("./package.json").size;
  if (no_gitignore) {
    msg("$ bun add @types/bun --no-save");
    await $`bun add @types/bun --no-save`;
    if (Bun.file("./package.json").size) {
      await $`rm package.json`;
    }
    const gitignore_path = findPath(gitignoreGlob);
    if (gitignore_path) {
      const file = Bun.file(gitignore_path);
      let gitignore_text = await file.text();
      if (gitignore_text.startsWith("node_modules/") || /\nnode_modules\//.test(gitignore_text)) {
        no_gitignore = false;
      } else if (path.relative(process.cwd(), gitignore_path) === ".gitignore") {
        await Bun.write(file, gitignore_text + "\nnode_modules/");
        no_gitignore = false;
      }
    }
    if (no_gitignore) {
      await Bun.write("./.gitignore", "node_modules/");
    }
  } else {
    msg("bun add @types/bun -d");
    await $`bun add @types/bun -d`;
  }
}
async function mainupdate() {
  const mainTs = mainDir + "/mainupdate/main.ts";
  if (Bun.file(mainTs).size === 0)
    return err("Not found " + mainTs);
  await $`
bun i
bun build ./main.ts --outdir ../ --target bun
`.cwd(mainDir + "/mainupdate");
}
async function jbFromTemplate(tmplName = "_") {
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
    text = text.replace(/(?<=\bimport .+? from )['"].+?[\/\\]funcs\.ts['"] *;?/g, JSON.stringify(mainDir + "/funcs.ts") + ";");
    const jbName = path.basename(path.dirname(tmpltPath)).slice(10) + ".ts";
    await Bun.write(jbName, text);
    await openInEditor(jbName);
  }
}
async function openInEditor(file) {
  if (!file)
    return err("Not found recipe file");
  const openCommand = (settings?.editor?.fileOpen ?? "code --goto %file%").replace("%file%", `"${file}"`);
  if (settings?.editor?.fileOpenReport) {
    msg(openCommand !== "none" ? "$ " + openCommand : `File opening disabled in ${mainDir}/settings.json:\n "editor"/"fileOpen": "none"`);
  }
  if (openCommand === "none")
    return;
  const { stderr, exitCode } = await $`${{ raw: openCommand }}`.nothrow();
  if (exitCode !== 0) {
    err(`Error opening recipe file:\n${stderr}`);
  }
}
async function runFromList(runRecipe, runnerPath) {
  const rPath = runnerPath === globalJB ? globalJB : `./${path.relative(process.cwd(), runnerPath)} (${path.resolve(runnerPath)})`;
  const list = parseRecipes(runRecipe);
  if (!list.length)
    return err(`No recipes found in file ${rPath}`);
  const listS = list.map((a, i) => `${i + 1}. ${a.join(" | ")}`).join("\n");
  msg(`List of recipes in ${rPath}):\n${listS}`);
  const listNames = list.flat().filter((s) => !s.startsWith(" #"));
  msg("Enter: ( <recipe number> | <recipe name> | <alias> ) [args]. Cancel: CTRL + C | `<Enter>");
  console.write("\u25C7 : ");
  for await (const line of console) {
    if (line === "`")
      return msg("Reset");
    const args = line.trimStart().split(/ +/);
    let recipeName = args.shift() || "<default>";
    const n = Math.floor(Number(recipeName));
    if (!isNaN(n) && n > 0) {
      if (n > list.length) {
        console.write(`\u25C7 Number outside the list
\u25C7 : `);
        continue;
      } else {
        recipeName = listNames[n - 1];
      }
    } else if (!listNames.includes(recipeName)) {
      console.write(`\u25C7 Wrong recipe name
\u25C7 : `);
      continue;
    }
    if (recipeName === "<default>")
      return await runRecipe(undefined);
    return await runRecipe(recipeName, args);
  }
}
var msg = (message) => console.log("\u25C7 " + message.replaceAll("\n", "\n  "));
var err = (message) => console.log("\u25C6 " + message.replaceAll("\n", "\n  "));
var mainDir = path.dirname(Bun.main);
var globalJB = mainDir + "/just_bun.ts";
var jbPattern = "{.,}[jJ][uU][sS][tT]_[bB][uU][nN]";
var jbGlob = new Glob(jbPattern + ".ts");
var gitignoreGlob = new Glob(".gitignore");
var fileSettings = Bun.file(mainDir + "/settings.json");
var settings = !fileSettings.size ? undefined : await fileSettings.json();

// ../../../code/JS/Bun/just-bun/just_bun-asm/index.ts
async function start(args) {
  let displayList = false;
  let runnerPath;
  switch (args[0]) {
    case "--help":
    case "-h":
      return printHelp();
    case "-t":
      return jbFromTemplate(args[1]);
    case "-@":
      return installTypes();
    case "-u":
      return mainupdate();
    case "-P":
      return msg(`Path to global recipe file: ${globalJB}`);
    case "-p":
      const fPath = findPath();
      return msg(`Path to recipe file: ${!fPath ? "Not found \u2191" : `./${path2.relative(process.cwd(), fPath)} (${fPath})`}`);
    case "-O":
      return openInEditor(globalJB);
    case "-o":
      return openInEditor(findPath());
    case "-L":
      runnerPath = globalJB;
    case "-l":
      displayList = true;
      break;
    case "-lf":
      displayList = true;
    case "-f":
      args.shift();
      runnerPath = args.shift();
      if (!runnerPath)
        return err("File path not passed");
      if (!runnerPath.endsWith(".ts"))
        return err("Incorrect file path");
      break;
    case "-g":
      args.shift();
      runnerPath = globalJB;
      break;
    default:
  }
  let reportPath = runnerPath;
  if (!runnerPath) {
    runnerPath = findPath();
    if (!runnerPath)
      return err("Not found \u2191 recipe file");
    reportPath = "./" + path2.relative(process.cwd(), runnerPath);
  } else {
    if (!Bun.file(runnerPath).size)
      return err(`Not found ${runnerPath}`);
  }
  const { runRecipe } = await import(path2.resolve(runnerPath));
  if (!runRecipe)
    return err(`${reportPath} does not contain export function runRecipe()`);
  if (displayList)
    return await runFromList(runRecipe, runnerPath);
  await runRecipe(args.shift(), args);
}
var printHelp = function() {
  msg(`Command Line Format variants:   
  * jb [-g] [<recipeName> [args]] - main use
  * jb -f <path/to/recipe/file>.ts [<recipeName> [args]]
  * jb -t [<templateSearchLine>]
  * jb -lf <path/to/recipe/file>.ts
  * jb <flag>

Flags:
  * -g  runs a recipe from the global recipe file located in the main.js folder
  * -f  runs a recipe from any .ts-file specified in <path/to/recipe/file>
  * -t  creates a new recipe file in the current folder based on the template 
         [found]() by the first characters specified in <templateSearchLine> 
  * -l  shows the path and numbered list of recipes for the current folder and offers 
         to run the recipe by indicating its number | name | alias and [args]
  * -L  is the same as -l, but for a global recipe file
  * -lf is the same as -l, but for the file <path/to/recipe/file>.ts
  * -o  [opens]() the current recipe file in the editor
  * -O  [opens]() the global recipe file in the editor
  * -p  prints relative and absolute path to the current recipe file
  * -P  prints the absolute path to the global recipe file
  * -@  installs/updates node_modules/ c @types/bun in the folder of the current recipe file, 
         if it doesn't find it, then in the current folder
  * -u [updates]() main.js from the internet
  * -h, --help  displays help on format command line and flags`);
};

// main.ts
await start(process.argv.slice(2));
