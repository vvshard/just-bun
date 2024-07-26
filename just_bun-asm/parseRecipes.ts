/** Returns a list of recipes based on the text of the function */
export function parseRecipes(fun: Function): [aliases: string[], comments: string[]][] {
    // in Bun toString() for function removes comments, formats spaces and indents, inserts semicolons, 
    // replaces undefined with "void 0", and escape chars non-ASCII
    const sfun = fun.toString();
    const switchM = /\n(?<spaces> +)switch \(recipeName\) \{/.exec(sfun);
    if (!switchM)
        return [];

    const spaces = switchM.groups!.spaces;
    const reStr = String.raw`\n${spaces
        }(  case (?<name>'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|\`(?:\\\`|[^\`])*\`|void 0):|(?<stop>)\}|  .+?)`;
    const re = RegExp(reStr, 'g');
    const list: [aliases: string[], comments: string[]][] = [];
    let aliases: string[] = [];
    let comments: string[] = [];
    const matches = sfun.slice(switchM.index + spaces.length).matchAll(re);
    for (const match of matches) {
        let { name, stop } = match.groups!;
        if (name) {
            switch (name[0]) {
                case 'v':
                    name = '<default>';
                    break;
                //@ts-ignore
                case "'":
                    name = name.replace(/\\'(?!$)/g, "'");
                //@ts-ignore
                case '`':
                    name = `"${name.slice(1, -1).replaceAll('"', '\\"')}"`;
                case '"': // deescape
                    name = JSON.parse(name);
            }
            (name.startsWith('#') ? comments : aliases).push(name);
        } else {
            if (aliases.length) {
                list.push([aliases, comments]);
            }
            if (stop)
                return list;
            aliases = [];
            comments = [];
        }
    }
    return list; // never?
}
