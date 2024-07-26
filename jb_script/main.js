// @bun
// ../../../code/JS/Bun/just-bun/just_bun-asm/index.ts
import path2 from "path";

// ../../../code/JS/Bun/just-bun/just_bun-asm/optionsFuncs.ts
import path from "path";
var {$, Glob } = globalThis.Bun;

// ../../../code/JS/Bun/just-bun/just_bun-asm/parseRecipes.ts
function parseRecipes(fun) {
  const sfun = fun.toString().replaceAll("\\\\", "\\\v");
  const iSwitch = sfun.search(/\bswitch \(recipeName\) \{/);
  if (iSwitch === -1)
    return [];
  const re = /\b(?<case_>case) ('(?<name1>(?:\\'|[^'])*)'|"(?<name2>(?:\\"|[^"])*)"|`(?<name3>(?:\\`|[^`])*)`|void 0):|'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|[;}{]|(?<!\\)(?:\$\{|`)/g;
  const stack = ["MAIN"];
  const list = [];
  let aliases = [];
  let comments = [];
  const matches = sfun.slice(iSwitch + 21).matchAll(re);
  for (const match of matches) {
    const { case_, name1, name2, name3 } = match.groups;
    const token = case_ ?? match[0];
    switch (stack.at(-1)) {
      case "MAIN":
        if (token === "case") {
          const name = JSON.parse(`"${(name1 ?? name2 ?? name3 ?? "<default>").replace(/(?<!\\)"/g, '\\"').replaceAll("\\\v", "\\\\")}"`);
          (name.startsWith("#") ? comments : aliases).push(name);
        } else {
          if (aliases.length) {
            list.push([aliases, comments]);
          }
          if (token === "}")
            return list;
          aliases = [];
          comments = [];
          if (token === "{" || token === "`") {
            stack.push(token);
          }
        }
        break;
      case "{":
        if (token === "{" || token === "`") {
          stack.push(token);
        } else if (token === "}") {
          stack.pop();
        }
        break;
      case "`":
        if (token === "${") {
          stack.push("{");
        } else if (token === "`") {
          stack.pop();
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
  const listS = list.map(([aliases, comments], i) => {
    let res = `${i + 1}. ${aliases.join(" | ")} `;
    return res + comments.join("\n" + " ".repeat(Bun.stringWidth(res)));
  }).join("\n");
  msg(`List of recipes in ${rPath}):\n${listS}`);
  msg("Enter: ( <number> | <name> | <alias> ) [args]. Cancel: <Space>");
  const listNames = list.flatMap(([aliases, comments]) => aliases);
  console.write("> ");
  for await (const line of console) {
    if (line.startsWith(" ") && !line.trim())
      return msg("Cancel");
    const args = line.trimStart().split(/ +/);
    let recipeName = args.shift() || "<default>";
    const n = Math.floor(Number(recipeName));
    if (!isNaN(n) && n > 0) {
      if (n > list.length) {
        console.write(`\u25C7 Number outside the list
> `);
        continue;
      } else {
        recipeName = list[n - 1][0][0];
      }
    } else if (!listNames.includes(recipeName)) {
      console.write(`\u25C7 Wrong recipe name
> `);
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
  if (!globalThis.Bun)
    return console.log("This script should be run in a Bun: https://bun.sh");
  if (Bun.version.split(".").reduce((a, n) => a * 1000 + +n, 0) < 1001019)
    return err("Version Bun must be at least 1.1.19 Run bun upgrade");
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
  msg(`\$ bun run "${Bun.main}": script - recipe launcher "just-bun"

Command Line Format variants (jb - alias for "bun <path>/${path2.basename(Bun.main)}"):   
  * jb [-g] [<recipeName> [args]]   # main use
  * jb -f <path/to/recipe/file>.ts [<recipeName> [args]]
  * jb -t [<templateSearchLine>]
  * jb -lf <path/to/recipe/file>.ts
  * jb <flag>

Flags:
  * -g  runs a recipe from the global recipe file located in the main.js folder. Without the -g flag, 
         the recipe file is searched in the current directory and up the chain of parent directories
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
