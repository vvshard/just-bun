/** Returns a list of recipes based on the text of the function */
export function parseRecipes(fun: Function): string {
    const re = /\b(?:switch \(([^\)]+)\)|case ("([^"]*)"|void 0):|return[ ;]|break;|default:)/g;
    let list = "";
    let alias = 0;
    let comment = "";
    let state: 'START' | 'MAIN' | 'SKIP' | 'END' = 'START';

    let arr: RegExpExecArray | null;
    const sfun = fun.toString();
    while ((arr = re.exec(sfun)) !== null && state !== 'END') {
        const keyword = arr[0].split(/[ ;:]/, 1)[0];
        switch (state) {
            case 'START':
                if (keyword === 'switch' && arr[1] === 'recipeName')
                    state = 'MAIN';
                break;

            case 'MAIN':
                switch (keyword) {
                    case 'case':
                        if (arr[3]?.startsWith('#')) {
                            comment += ' ' + arr[3];
                        } else {
                            list += (['', ' / '][alias] ?? ' ') + (arr[3] ?? '<default>');
                            alias += 1;
                        }
                        break;
                    case 'break':
                    case 'return':
                        list += comment + '\n';
                        alias = 0;
                        comment = "";
                        break;
                    case 'default':
                        state = 'END';
                        break;
                    case 'switch':
                        state = 'SKIP';
                        break;
                    default:
                }
                break;

            case 'SKIP':
                if (keyword === 'default')
                    state = 'MAIN';
        }
    }
    return list.trim();
}
