// @bun
// ../just_bun-asm/index.ts
import path from "path";
async function start(args) {
  let isGlob = false;
  let displayList = false;
  let runnerPath = "";
  switch (args[0]) {
    case "--help":
    case "-h":
      return logHelp();
    case "-@":
      return installTypes();
    case "-p":
      return console.log(`Path to just_bun.js: ${findPath()}/`);
    case "-pg":
      return console.log(`Path to global just_bun.js: ${path.dirname(Bun.main)}/`);
    case "-lg":
      isGlob = true;
    case "-l":
      displayList = true;
      break;
    case "-g":
      isGlob = true;
  }
  runnerPath = (isGlob ? path.dirname(Bun.main) : findPath()) + "/just_bun.js";
  const { runRecipe } = await import(runnerPath);
  if (!runRecipe)
    throw new Error(`${runnerPath} does not contain function runRecipe()`);
  if (displayList)
    return parseRecipes(runRecipe.toString());
  if (isGlob) {
    args.shift();
  }
  await runRecipe(args.shift(), args);
}
var findPath = function() {
  let currentPath = ".";
  let parentPath = process.cwd();
  do {
    if (Bun.file(parentPath + "/just_bun.js").size != 0)
      return currentPath === "." ? "." : parentPath;
    currentPath = parentPath;
    parentPath = path.dirname(currentPath);
  } while (parentPath != currentPath);
  throw new Error("Non-empty file just_bun.js not found");
};
var logHelp = function() {
  throw new Error("Function logHelp() not implemented.");
};
var installTypes = function() {
  throw new Error("Function not implemented.");
};
var parseRecipes = function(arg0) {
  throw new Error("Function not implemented.");
};

// main.ts
start(process.argv.slice(2));
