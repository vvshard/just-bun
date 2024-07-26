/** Returns a list of recipes based on the text of the function */
export function parseRecipes(fun: Function): [aliases: string[], comments: string[]][] {
    // in Bun toString() for function removes comments, formats whitespace, places semicolons, 
    // replaces undefined with "void 0" and encodes non-ASCII 
    const sfun = fun.toString().replaceAll('\\\\', '\\\v');
    const iSwitch = sfun.search(/\bswitch \(recipeName\) \{/);
    if (iSwitch === -1)
        return [];

    const re = /\b(?<case_>case) ('(?<name1>(?:\\'|[^'])*)'|"(?<name2>(?:\\"|[^"])*)"|`(?<name3>(?:\\`|[^`])*)`|void 0):|'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|[;}{]|(?<!\\)(?:\$\{|`)/g;
    const stack: ('MAIN' | '{' | '`')[] = ['MAIN'];
    const list: [aliases: string[], comments: string[]][] = [];
    let aliases: string[] = [];
    let comments: string[] = [];
    const matches = sfun.slice(iSwitch + 21).matchAll(re);
    for (const match of matches) {
        const { case_, name1, name2, name3 } = match.groups!;
        const token = case_ ?? match[0];
        switch (stack.at(-1)) {
            case 'MAIN':
                if (token === 'case') { // deescape
                    const name: string = JSON.parse(`"${(name1 ?? name2 ?? name3 ?? '<default>')
                        .replace(/(?<!\\)"/g, '\\"').replaceAll('\\\v', '\\\\')}"`);
                    (name.startsWith('#') ? comments : aliases).push(name);
                } else {
                    if (aliases.length) {
                        list.push([aliases, comments]);
                    }
                    if (token === '}')
                        return list;
                    aliases = [];
                    comments = [];
                    if (token === '{' || token === '`') {
                        stack.push(token);
                    }
                }
                break;
            case '{':
                if (token === '{' || token === '`') {
                    stack.push(token);
                } else if (token === '}') {
                    stack.pop();
                }
                break;
            case '`':
                if (token === '${') {
                    stack.push('{');
                } else if (token === '`') {
                    stack.pop();
                }
        }
    }
    return list; // never?
}
