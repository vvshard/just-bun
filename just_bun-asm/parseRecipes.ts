/** Returns a list of recipes based on the text of the function */
export function parseRecipes(fun: Function): string {
    const re = /\b(?<word>switch \(recipeName\) \{|case (["'](?<name>[^"']*)["']|void 0):|return[ ;]|break;)|(?<!\\)(?<token>\$\{|['"`\{}])/g;
    let list = "";
    let alias = 0;
    let comment = "";
    type State = 'START' | 'MAIN' | '`' | '\'' | '"' | '{';
    let stack: State[] = ['START'];

    const matches = fun.toString().matchAll(re);
    for (const match of matches) {
        const state = stack.at(-1)!;
        const { word, name, token: token0 } = match.groups!;
        const token = token0 ?? word.split(/[ ;:]/, 1)[0];
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
                            list += comment ? JSON.parse(`"${comment}"`) + '\n' : '\n';
                            alias = 0;
                        }
                        comment = "";
                        if (token === '}')
                            return list.trim();
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
