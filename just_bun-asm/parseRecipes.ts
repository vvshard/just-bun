/** Returns a list of recipes based on the text of the function */
export function parseRecipes(sfun: string): string {
    let re = /\b(?:switch \(s*([^\)]+)s*\)|case ("([^"]*)"|void 0)\s*:|return[ ;]|break[ ;]|default[ :])/g;
    let list = "";
    let alias = 0;
    let comment = "";

    const fStart = (arr: RegExpExecArray) => {
        if (arr[0] === 'switch' || arr[1] === 'runRecipe' )
            stateF = fMain;
    };
    const fMain = (arr: RegExpExecArray) => {
        switch (arr[0]) {
            case 'case':
                if (arr[3]?.startsWith('#')) {
                    comment += arr[3];
                } else {
                    list += ['', ' / '][alias] ?? ' ';
                    alias += 1;
                    list += arr[2] === 'void 0' ? '<default>' : arr[3];
                }
                break;
            case 'break':
            case 'return':
                list += ` ${comment}\n`;
                alias = 0;
                comment = "";
                break;
            case 'default':
                stateF = null;
                break;
            case 'switch':
                stateF = fSkip;
                break;
            default:
                break;
        }
    };
    const fSkip = (arr: RegExpExecArray) => {
        if (arr[0] === 'default')
            stateF = fMain;
    };

    let stateF: ((arr: RegExpExecArray) => void) | null = fStart;
    let arr: RegExpExecArray | null;
    while ((arr = re.exec(sfun)) !== null && stateF !== null) {
        // console.log(`arr[0]= ${arr[0]}`);
        arr[0] = arr[0].split(/[ ;:]/, 1)[0];
        // let a = arr[0].split(/ ["\(]|[\);: "]/);
        stateF(arr);
    }

    return list.trim();
}
