// @bun
// ../../../code/JS/Bun/just-bun/just_bun-asm/index.ts
import path2 from "path";

// ../../../code/JS/Bun/just-bun/just_bun-asm/parseRecipes.ts
function parseRecipes(fun) {
  const re = /\b(?:switch \(s*([^\)]+)s*\)|case ("([^"]*)"|void 0)\s*:|return[ ;]|break[ ;]|default[ :])/g;
  let list = "";
  let alias = 0;
  let comment = "";
  let state = "START";
  let arr;
  const sfun = fun.toString();
  while ((arr = re.exec(sfun)) !== null && state !== "END") {
    const keyword = arr[0].split(/[ ;:]/, 1)[0];
    switch (state) {
      case "START":
        if (keyword === "switch" && arr[1] === "recipeName")
          state = "MAIN";
        break;
      case "MAIN":
        switch (keyword) {
          case "case":
            if (arr[3]?.startsWith("#")) {
              comment += " " + arr[3];
            } else {
              list += (["", " / "][alias] ?? " ") + (arr[3] ?? "<default>");
              alias += 1;
            }
            break;
          case "break":
          case "return":
            list += comment + "\n";
            alias = 0;
            comment = "";
            break;
          case "default":
            state = "END";
            break;
          case "switch":
            state = "SKIP";
            break;
          default:
        }
        break;
      case "SKIP":
        if (keyword === "default")
          state = "MAIN";
    }
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
    csl(`Template found: ${tmpltPath}`);
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
    csl(openCommand !== "none" ? "$ " + openCommand : `File opening disabled in ${mainDir}/settings.json:\n "editor"/"fileOpen": "none"`);
  }
  if (openCommand === "none")
    return;
  const { stderr, exitCode } = await $`${{ raw: openCommand }}`.nothrow();
  if (exitCode !== 0) {
    err(`Error opening recipe file:\n${stderr}`);
  }
}
async function runByNumber(runRecipe) {
  const listR = parseRecipes(runRecipe).split("\n");
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
      let recipeName = listR[n - 1].split(" ", 1)[0];
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
var mainDir = path.dirname(Bun.main);
var globalJB = mainDir + "/just_bun.ts";
var jbPattern = "{.,}[jJ][uU][sS][tT]_[bB][uU][nN]";
var jbGlob = new Glob(jbPattern + ".ts");
var gitignoreGlob = new Glob(".gitignore");
var fileSettings = Bun.file(mainDir + "/settings.json");
var settings = !fileSettings.size ? undefined : await fileSettings.json();

// ../../../code/JS/Bun/just-bun/just_bun-asm/index.ts
async function start(args) {
  let displayList;
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
      return csl(`Path to global recipe file: ${globalJB}`);
    case "-p":
      return csl(`Path to recipe file: ${findPath() ?? "Not found \u2191"}`);
    case "-O":
      return openInEditor(globalJB);
    case "-o":
      return openInEditor(findPath());
    case "-L":
      runnerPath = globalJB;
    case "-l":
      displayList = "show";
      break;
    case "-N":
      runnerPath = globalJB;
    case "-n":
      displayList = "select";
      break;
    case "-nf":
      displayList = "select";
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
  switch (displayList) {
    case undefined:
      return await runRecipe(args.shift(), args);
    case "select":
      return await runByNumber(runRecipe);
    case "show":
      csl(`List of recipes in ${reportPath}:\n${parseRecipes(runRecipe)}`);
  }
}
var printHelp = function() {
  csl("Help3");
};

// main.ts
await start(process.argv.slice(2));
