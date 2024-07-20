/** Returns a list of recipes based on the text of the function */
export function parseRecipes(fun: Function): string {
    const rs = String.raw`\b(?<word>case ('(?<name1>(?:\\'|[^'])*)'|"(?<name2>(?:\\"|[^"])*)"|void 0):`
        + String.raw`|switch \(recipeName\) \{|break\b|return\b)|(?<!\\)(?<token>\$\{|[\`'"\{}])`;
    const re = RegExp(rs, 'g');
    let list = "";
    let alias = 0;
    let comment = "";
    type State = 'START' | 'MAIN' | '`' | '\'' | '"' | '{';
    let stack: State[] = ['START'];

    const matches = fun.toString().matchAll(re);
    for (const match of matches) {
        const state = stack.at(-1)!;
        const { word, name1, name2, token: token0 } = match.groups!;
        const name = name1 ?? name2;
        const token = token0 ?? word.split(' ', 1)[0];
        switch (state) {
            case 'START':
                if (token === 'switch')
                    stack.push('MAIN');
                break;

            case 'MAIN':
                switch (token) {
                    case 'case':
                        if (name?.startsWith('#')) {
                            comment += ' ' + name;
                        } else {
                            list += (['', ' / '][alias] ?? ' ') + (name ?? '<default>');
                            alias += 1;
                        }
                        break;
                    case 'break':
                    case 'return':
                    case '}':
                        if (alias) {
                            list += comment ? JSON.parse(`"${comment.replaceAll('"', '\\"')}"`) + '\n' : '\n';
                            alias = 0;
                        }
                        if (token === '}')
                            return list.trim();
                        comment = "";
                        break;
                    case 'switch':
                        stack.push('{');
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
                } else if ('`\'"'.includes(token)) {
                    stack.push(token as State);
                }
                break;
        }
    }
    return list.trim();
}
