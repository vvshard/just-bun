import { expect, test } from "bun:test";
import { parseRecipes } from "../lib/parseRecipes";

test("parseRecipes()", () => {
    expect(parseRecipes(runRecipe)).toEqual([
        [['n0', 'a0▶'], ["# `■c\"m'00'`\\", '# `■c\'m"01"`\\']],
        [['n1▶', 'a1'], []],
        [['n2', 'a2'], [`# "c\`m'2'"\\`]],
        [['n3'], []],
        [['n4'], []],
    ]);
});

function runRecipe(recipeName: string, args = []) {
    /**
    switch (recipeName) {
        case 'falseName':
            break;
    }
     */
    switch (recipeName) {
        case 'n0':
        case "# `■c\"m'00'`\\":
        case 'a0▶':
        case '# `■c\'m"01"`\\':
            break;
        case '# none':
            break;
        case "n1▶":
        case "a1": {
            switch (args[0]) {
                case 'lvl2':
                    break;
            }
            return;
        }
        default:
            break;
        case `# "c\`m'2'"\\`:
        case `n2`:
        case `a2`:
            let s = `
case 'strCase':    
        }}`;
            return s;
            break;
        case 'n3': return;
        case 'n4':
    }

    switch (args[0]) {
        case 'alienCase':
            break;
        default:
            break;
    }
}