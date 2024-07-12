// @bun
// ../../../code/JS/Bun/just-bun/just_bun-asm/index.ts
import path from "path";
var {$ } = globalThis.Bun;
async function start(args) {
  let isGlob = false;
  let displayList = false;
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
    case "-pg":
      return cl(`Path to global justbun.mjs: ${jb_global}/`);
    case "-p":
      return cl(`Path to justbun.mjs: ${findPath()}/`);
    case "-og":
      return openInEditor(jb_global);
    case "-o":
      return openInEditor(findPath());
    case "-lg":
      isGlob = true;
    case "-l":
      displayList = true;
      break;
    case "-g":
      isGlob = true;
  }
  let runnerPath = isGlob ? jb_global : findPath();
  if (runnerPath === "Not found \u2191")
    return clErr(`${runnerPath} justbun.mjs`);
  const { runRecipe } = await import((runnerPath === "." ? cwd : runnerPath) + "/justbun.mjs");
  if (!runRecipe)
    return clErr(`${runnerPath}/justbun.mjs does not contain function runRecipe()`);
  if (displayList)
    return cl(parseRecipes(runRecipe.toString()));
  if (isGlob) {
    args.shift();
  }
  await runRecipe(args.shift(), args);
}
var printHelp = function() {
  cl("Help3");
};
var findPath = function(file = "justbun.mjs") {
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
    return clErr("Not found \u2191 justbun.mjs");
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
    return clErr("Not found " + mainTs);
  await $`
bun i
bun build ./main.ts --outdir ../ --target bun`.cwd(jb_global + "/mainupdate");
}
var parseRecipes = function(sfun) {
  return sfun;
};
async function jb_from_template(tmplName) {
  if (Bun.file("justbun.mjs").size !== 0) {
    cl("There is already a file justbun.mjs in the current directory");
    openInEditor(".");
  } else {
    let t = await $`ls ${tmplName}*.js`.cwd(jb_global + "/templates").nothrow().text();
    t = t.split(/[\n\r]/)[0].trim();
    if (!t)
      return clErr(`A file matching the pattern "${tmplName}*.js"
                was not found in ${jb_global}/templates`);
    await Bun.write("./justbun.mjs", Bun.file(`${jb_global}/templates/${t}`));
    await openInEditor(".");
  }
}
async function openInEditor(path2) {
  if (path2 === "Not found \u2191")
    return clErr("Not found justbun.mjs");
  const config = await Bun.file(jb_global + "/package.json").json();
  const openCommand = config.editor?.fileOpen;
  if (!openCommand)
    return clErr(`In ${jb_global}/package.json not specified editor.fileOpen`);
  const { stderr, exitCode } = path2 === "." ? await $`${{ raw: openCommand.replace("%file%", "./justbun.mjs") }}`.nothrow() : await $`${{ raw: openCommand.replace("%file%", "./justbun.mjs") }}`.nothrow().cwd(path2);
  if (exitCode !== 0) {
    clErr(`Error opening "justbun.mjs":\n   ${stderr}`);
  }
}
var jb_global = path.dirname(Bun.main);
var cwd = process.cwd();
var cl = (msg) => console.log("\u25C7 " + msg);
var clErr = (msg) => console.log("\u25C6 " + msg);

// main.ts
await start(process.argv.slice(2));
