// @bun
// ../../../code/JS/Bun/just-bun/just_bun-asm/index.ts
import path from "path";
var {$ } = globalThis.Bun;

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

// ../../../code/JS/Bun/just-bun/just_bun-asm/index.ts
async function start(args) {
  let isGlob = false;
  let displayList = "none";
  let runnerPath = "";
  switch (args[0]) {
    case "--help":
    case "-h":
      return printHelp();
    case "-t":
      return jb_from_template(args[1]);
    case "-@":
      return installTypes();
    case "-u":
      return mainupdate();
    case "-P":
      return csl(`Path to global just_bun.mjs: ${jb_global}/`);
    case "-p":
      return csl(`Path to just_bun.mjs: ${findPath()}/`);
    case "-O":
      return openInEditor(jb_global);
    case "-o":
      return openInEditor(findPath());
    case "-L":
      isGlob = true;
    case "-l":
      displayList = "show";
      break;
    case "-N":
      isGlob = true;
    case "-n":
      displayList = "select";
      break;
    case "-f":
      args.shift();
      runnerPath = args.shift() ?? "";
      if (!runnerPath)
        return err("File path not passed");
      if (Bun.file(runnerPath).size === 0 || !runnerPath.endsWith("js"))
        return err("Incorrect file path");
      break;
    case "-g":
      args.shift();
      isGlob = true;
  }
  if (!runnerPath) {
    runnerPath = isGlob ? jb_global : findPath();
    if (runnerPath === "Not found \u2191")
      return err("Not found \u2191 just_bun.mjs");
    runnerPath += "/just_bun.mjs";
  }
  const { runRecipe } = await import(path.resolve(runnerPath));
  if (!runRecipe)
    return err(`${runnerPath} does not contain function runRecipe()`);
  if (displayList === "show")
    return csl(`List of recipes in ${runnerPath}: \n${parseRecipes(runRecipe.toString())}`);
  if (displayList === "select")
    return runByNumber(runRecipe);
  runRecipe(args.shift(), args);
}
var printHelp = function() {
  csl("Help3");
};
var findPath = function(file = "just_bun.mjs") {
  let currentPath = ".";
  let parentPath = cwd;
  do {
    if (Bun.file(`${parentPath}/${file}`).size !== 0)
      return currentPath === "." ? "." : parentPath;
    currentPath = parentPath;
    parentPath = path.dirname(currentPath);
  } while (parentPath != currentPath);
  return "Not found \u2191";
};
async function installTypes() {
  const jb_path = findPath();
  if (jb_path === "Not found \u2191")
    return err("Not found \u2191 just_bun.mjs");
  let exist_gitignore = false;
  process.chdir(jb_path);
  if (Bun.file("./package.json").size === 0) {
    await $`bun add @types/bun --no-save; rm package.json`;
  } else {
    exist_gitignore = true;
    await $`bun add @types/bun -d`;
  }
  if (!exist_gitignore) {
    const gitignore_path = findPath(".gitignore");
    if (gitignore_path !== "Not found \u2191") {
      const file = Bun.file(gitignore_path + "/.gitignore");
      let gitignore_text = await file.text();
      if (gitignore_text.startsWith("node_modules/") || /\nnode_modules\//.test(gitignore_text)) {
        exist_gitignore = true;
      } else if (jb_path === ".") {
        await Bun.write(file, gitignore_text + "\nnode_modules/");
        exist_gitignore = true;
      }
    }
  }
  if (!exist_gitignore) {
    await Bun.write("./.gitignore", "node_modules/");
  }
}
async function mainupdate() {
  const mainTs = jb_global + "/mainupdate/main.ts";
  if (Bun.file(mainTs).size === 0)
    return err("Not found " + mainTs);
  await $`
bun i
bun build ./main.ts --outdir ../ --target bun
`.cwd(jb_global + "/mainupdate");
}
async function jb_from_template(tmplName = "_") {
  if (Bun.file("just_bun.mjs").size !== 0) {
    err("There is already a file just_bun.mjs in the current directory");
    openInEditor(".");
  } else {
    let t = await $`
        ls ${tmplName}*.mjs
        `.cwd(jb_global + "/templates").nothrow().text();
    t = t.split(/[\n\r]/)[0].trim();
    if (!t)
      return err(`A file matching the pattern "${tmplName}*.js"
                was not found in ${jb_global}/templates`);
    let text = await Bun.file(`${jb_global}/templates/${t}`).text();
    text = text.replace(/(?<=\bimport .+? from )['"].+?[\/\\]funcs\.mjs['"] *;?/, JSON.stringify(jb_global + "/funcs.mjs") + ";");
    await Bun.write("./just_bun.mjs", text);
    await openInEditor(".");
  }
}
async function openInEditor(path2) {
  if (path2 === "Not found \u2191")
    return err("Not found just_bun.mjs");
  const config = await Bun.file(jb_global + "/package.json").json();
  const openCommand = config.editor?.fileOpen;
  if (!openCommand)
    return err(`In ${jb_global}/package.json not specified editor.fileOpen`);
  const { stderr, exitCode } = path2 === "." ? await $`${{ raw: openCommand.replace("%file%", "./just_bun.mjs") }}`.nothrow() : await $`${{ raw: openCommand.replace("%file%", "./just_bun.mjs") }}`.nothrow().cwd(path2);
  if (exitCode !== 0) {
    err(`Error opening "just_bun.mjs":\n   ${stderr}`);
  }
}
async function runByNumber(runRecipe) {
  const listR = parseRecipes(runRecipe.toString()).split("\n");
  csl("Enter the recipe number and, if necessary, arguments:");
  console.log(listR.map((s, i) => `${i + 1}. ${s}`).join("\n"));
  for await (const line of console) {
    const args = line.split(" ");
    const n = Math.floor(Number(args.shift()));
    if (isNaN(n)) {
      console.write("Enter the recipe NUMBER\n");
    } else if (n < 1 || n > listR.length) {
      console.write("Number outside the list\n");
    } else {
      let recipeName = listR[n - 1].split("/")[0].trim();
      if (recipeName === "<default>") {
        runRecipe(undefined);
      } else {
        runRecipe(recipeName, args);
      }
      return;
    }
  }
}
var cwd = process.cwd();
var jb_global = path.dirname(Bun.main);
var { csl, err } = await import(jb_global + "/funcs.mjs");

// main.ts
await start(process.argv.slice(2));
