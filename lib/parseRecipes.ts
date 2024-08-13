/** Returns a list of recipes based on the text of the fun */
export function parseRecipes(fun: Function): [aliases: string[], comments: string[]][] {
    // in Bun toString() for function removes comments, formats spaces and indents, inserts semicolons, 
    // replaces undefined with "void 0", and escape chars non-ASCII
    const sfun = fun.toString();
    const switchM = /\n(?<spaces> +)switch \(recipeName\) \{/.exec(sfun);
    if (!switchM)
        return [];

    const reStr = String.raw`\n${switchM.groups!.spaces
        }(?:  case (?<name>'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|\`(?:\\\`|[^\`])*\`|void 0):|(?<stop>\})|  .)`;
    const re = RegExp(reStr, 'g');
    let aliases_comments: [aliases: string[], comments: string[]] = [[], []];
    const list: typeof aliases_comments[] = [];
    const matches = sfun.slice(switchM.index + 1).matchAll(re);
    for (const match of matches) {
        let { name, stop } = match.groups!;
        if (name) {
            if (name === 'void 0') {
                name = '<default>';
            } else {
                const q = name[0];
                if (q !== '"') {
                    name = `"${name.slice(1, -1).replaceAll('\\' + q, q).replaceAll('"', '\\"')}"`;
                }
                name = JSON.parse(name); // deescape
            }
            aliases_comments[+name.startsWith('#')].push(name);
        } else {
            if (aliases_comments[0].length) {
                list.push(aliases_comments);
            }
            if (stop)
                return list;
            aliases_comments = [[], []];
        }
    }
    return list; // never?
}
