// @bun
// ../../just_bun-asm/index.ts
import path from "path";
var {$ } = globalThis.Bun;
async function start(args) {
  let isGlob = false;
  let displayList = false;
  switch (args[0]) {
    case "--help":
    case "-h":
      return printHelp();
    case "-@":
      return installTypes();
    case "-u":
      return mainupdate();
    case "-p":
      return console.log(`Path to just_bun.js: ${findPath()}/`);
    case "-pg":
      return console.log(`Path to global just_bun.js: ${jb_global}/`);
    case "-lg":
      isGlob = true;
    case "-l":
      displayList = true;
      break;
    case "-g":
      isGlob = true;
  }
  let runnerPath = (isGlob ? jb_global : findPath()) + "/just_bun.js";
  if (runnerPath === "Not found \u2191/just_bun.js")
    return console.log(runnerPath);
  const { runRecipe } = await import(runnerPath);
  if (!runRecipe)
    return console.log(`${runnerPath} does not contain function runRecipe()`);
  if (displayList)
    return console.log(parseRecipes(runRecipe.toString()));
  if (isGlob) {
    args.shift();
  }
  await runRecipe(args.shift(), args);
}
var findPath = function() {
  let currentPath = ".";
  let parentPath = process.cwd();
  do {
    if (Bun.file(parentPath + "/just_bun.js").size !== 0)
      return currentPath === "." ? "." : parentPath;
    currentPath = parentPath;
    parentPath = path.dirname(currentPath);
  } while (parentPath != currentPath);
  return "Not found \u2191";
};
var printHelp = function() {
  console.log("Help3");
};
var installTypes = function() {
  throw new Error("Function installTypes() not implemented.");
};
var parseRecipes = function(arg0) {
  throw new Error("Function parseRecipes() not implemented.");
};
async function mainupdate() {
  const mainTs = jb_global + "/mainupdate/main.ts";
  if (Bun.file(mainTs).size === 0)
    return console.log("Not found " + mainTs);
  await $`
bun i
bun build ./main.ts --outdir ../ --target bun
echo Ok
`.cwd(jb_global + "/mainupdate");
}
var jb_global = path.dirname(Bun.main);

// main.ts
await start(process.argv.slice(2));
