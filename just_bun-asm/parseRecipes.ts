/** Returns a list of recipes based on the text of the function */
export function parseRecipes(fun: Function): [aliases: string[], comments: string[]][] {
    const sfun = fun.toString();
    // in Bun toString() for function removes comments, formats whitespace, places semicolons, 
    // replaces undefined with "void 0" and encodes non-ASCII 
    const iSwitch = sfun.search(/\bswitch \(recipeName\) \{/);
    if (iSwitch === -1)
        return [];

    const re = /\b(?<case_>case) ('(?<name1>(?:\\'|[^'])*)'|"(?<name2>(?:\\"|[^"])*)"|`(?<name3>(?:\\`|[^`])*)`|void 0):|;|(?<!\\)(?<token>\$\{|[}'"`\{])/g;
    type State = 'MAIN' | '\'' | '"' | '`' | '{';
    type Token = 'case' | ';' | '${' | '}' | '\'' | '"' | '`' | '{';
    const stack: State[] = ['MAIN'];
    const list: [aliases: string[], comments: string[]][] = [];
    let aliases: string[] = [];
    let comments: string[] = [];
    const matches = sfun.slice(iSwitch + 21).matchAll(re);
    for (const match of matches) {
        const { case_, name1, name2, name3, token: token0 } = match.groups!;
        const token = (token0 ?? case_ ?? ';') as Token;
        const state = stack.at(-1)!;
        switch (state) {
            case 'MAIN':
                switch (token) {
                    case 'case':
                        // deescape
                        const name: string = JSON.parse(`"${(name1 ?? name2 ?? name3 ?? '<default>')
                            .replaceAll('"', '\\"')}"`);
                        (name.startsWith('#') ? comments : aliases).push(name);
                        break;
                    case ';':
                    case '}':
                        if (aliases.length) {
                            list.push([aliases, comments]);
                        }
                        if (token === '}')
                            return list;
                        aliases = [];
                        comments = [];
                        break;
                    default:
                        stack.push(token as State);
                }
                break;

            //@ts-ignore
            case '`':
                if (token === '${') {
                    stack.push('{');
                    break;
                }
            case '\'':
            case '"':
                if (token === state) {
                    stack.pop();
                }
                break;
            case '{':
                if (token === '}') {
                    stack.pop();
                } else if (token === token0) {
                    stack.push(token as State);
                }
        }
    }
    return list; // never?
}
