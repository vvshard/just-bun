// @bun
// ../../../code/JS/Bun/just-bun/just_bun-asm/index.ts
import path2 from "path";

// ../../../code/JS/Bun/just-bun/just_bun-asm/parseRecipes.ts
function parseRecipes(sfun) {
  let re = /\b(?:switch\s*\([^\)]+\)|case\s*(?:"[^"]*|void 0)"?\s*:|return\s*|break\s*;|default\s*:)/g;
  let list = "";
  let alias = 0;
  const fStart = (a) => {
    if (a[0] === "switch")
      stateF = fMain;
  };
  const fMain = (a) => {
    switch (a[0]) {
      case "case":
        list += ["", " / "][alias] ?? " ";
        alias += 1;
        list += a[1] === "void" && a[2] === "0" ? "<default>" : a[1];
        break;
      case "break":
      case "return":
        list += "\n";
        alias = 0;
        break;
      case "default":
        stateF = null;
        break;
      case "switch":
        stateF = fSkip;
        break;
      default:
        break;
    }
  };
  const fSkip = (a) => {
    if (a[0] === "default")
      stateF = fMain;
  };
  let stateF = fStart;
  let arr;
  while ((arr = re.exec(sfun)) !== null && stateF !== null) {
    let a = arr[0].split(/ ["\(]|[\);: "]/);
    stateF(a);
  }
  return list.trim();
}

// ../../../code/JS/Bun/just-bun/just_bun-asm/optionsFuncs.ts
import path from "path";
var {$, Glob } = globalThis.Bun;
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
    csl("$ bun add @types/bun --no-save");
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
    csl("bun add @types/bun -d");
    await $`bun add @types/bun -d`;
  }
}
async function mainupdate() {
  const mainTs = jb_script + "/mainupdate/main.ts";
  if (Bun.file(mainTs).size === 0)
    return err("Not found " + mainTs);
  await $`
bun i
bun build ./main.ts --outdir ../ --target bun
`.cwd(jb_script + "/mainupdate");
}
async function jbFromTemplate(tmplName = "_") {
  const rcpFile = jbGlob.scanSync({ dot: true }).next().value;
  if (rcpFile) {
    err(`There is already a file "${rcpFile}" in the current directory`);
    openInEditor(rcpFile);
  } else {
    const glob = new Glob(`templates-${jbPattern}/${tmplName}*.ts`);
    const tmpltPath = glob.scanSync({ cwd: jb_script, dot: true, absolute: true }).next().value;
    if (!tmpltPath)
      return err(`The template file matching the pattern "${tmplName}*.ts" was not found.`);
    csl(`Template found: ${tmpltPath}`);
    let text = await Bun.file(`${tmpltPath}`).text();
    text = text.replace(/(?<=\bimport .+? from )['"].+?[\/\\]funcs\.ts['"] *;?/g, JSON.stringify(jb_script + "/funcs.ts") + ";");
    const jbName = path.basename(path.dirname(tmpltPath)).slice(10) + ".ts";
    await Bun.write(jbName, text);
    await openInEditor(jbName);
  }
}
async function openInEditor(file) {
  if (!file)
    return err("Not found recipe file");
  const openCommand = (package_json?.editor?.fileOpen ?? "code --goto %file%").replace("%file%", `"${file}"`);
  if (openCommand === "none")
    return csl(`File opening disabled in ${jb_script}/package.json:\n "editor"/"fileOpen": "none"`);
  csl("$ " + openCommand);
  const { stderr, exitCode } = await $`${{ raw: openCommand }}`.nothrow();
  if (exitCode !== 0) {
    err(`Error opening recipe file:\n${stderr}`);
  }
}
async function runByNumber(runRecipe) {
  const listR = parseRecipes(runRecipe.toString()).split("\n");
  csl("Enter the recipe number and, if necessary, arguments:\n" + listR.map((s, i) => `${i + 1}. ${s}`).join("\n"));
  for await (const line of console) {
    if (!line)
      return csl("Reset");
    const args = line.split(" ");
    const n = Math.floor(Number(args.shift()));
    if (isNaN(n)) {
      console.write("Enter the recipe NUMBER\n");
    } else if (n < 1 || n > listR.length) {
      console.write("Number outside the list\n");
    } else {
      let recipeName = listR[n - 1].split("/", 1)[0].trim();
      if (recipeName === "<default>") {
        await runRecipe(undefined);
      } else {
        await runRecipe(recipeName, args);
      }
      return;
    }
  }
}
var csl = (msg) => console.log("\u25C7 " + msg.replaceAll("\n", "\n  "));
var err = (msg) => console.log("\u25C6 " + msg.replaceAll("\n", "\n  "));
var jb_script = path.dirname(Bun.main);
var jbPattern = "{.,}[jJ][uU][sS][tT]_[bB][uU][nN]";
var jbGlob = new Glob(jbPattern + ".ts");
var gitignoreGlob = new Glob(".gitignore");
var filePackage = Bun.file(jb_script + "/package.json");
var package_json = !filePackage.size ? undefined : await filePackage.json();

// ../../../code/JS/Bun/just-bun/just_bun-asm/index.ts
async function start(args) {
  let isGlobal = false;
  let displayList = "none";
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
      return csl(`Path to global recipe file: ${jb_script}/just_bun.ts`);
    case "-p":
      return csl(`Path to recipe file: ${findPath() ?? "Not found \u2191"}`);
    case "-O":
      return openInEditor(jb_script + "/just_bun.ts");
    case "-o":
      return openInEditor(findPath());
    case "-L":
      isGlobal = true;
    case "-l":
      displayList = "show";
      break;
    case "-N":
      isGlobal = true;
    case "-n":
      displayList = "select";
      break;
    case "-f":
      args.shift();
      runnerPath = args.shift();
      if (!runnerPath)
        return err("File path not passed");
      if (!runnerPath.endsWith(".ts") || Bun.file(runnerPath).size === 0)
        return err("Incorrect file path");
      break;
    case "-g":
      args.shift();
      isGlobal = true;
  }
  if (!runnerPath) {
    runnerPath = isGlobal ? jb_script + "/just_bun.ts" : findPath();
    if (!runnerPath)
      return err("Not found \u2191 recipe file");
  }
  const { runRecipe } = await import(path2.resolve(runnerPath));
  if (!runRecipe)
    return err(`${runnerPath} does not contain export function runRecipe()`);
  if (displayList === "show")
    return csl(`List of recipes in ${runnerPath}:\n${parseRecipes(runRecipe.toString())}`);
  if (displayList === "select")
    return runByNumber(runRecipe);
  await runRecipe(args.shift(), args);
}
var printHelp = function() {
  csl("Help3");
};

// main.ts
await start(process.argv.slice(2));
