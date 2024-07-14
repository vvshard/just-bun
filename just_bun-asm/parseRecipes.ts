/** Returns a list of recipes based on the text of the function */
export function parseRecipes(sfun: string): string {
    let re = /\b(?:switch\s*\([^\)]+\)|case\s*(?:"[^"]*|void 0)"?\s*:|return\s*|break\s*;|default\s*:)/g;
    let list = "";
    let alias = 0;

    const fStart = (a: string[]) => {
        if (a[0] === 'switch')
            stateF = fMain;
    };
    const fMain = (a: string[]) => {
        switch (a[0]) {
            case 'case':
                list += ['', ' / '][alias] ?? ' ';
                alias += 1;
                list += a[1] === 'void' && a[2] === '0' ? '<default>' : a[1];
                break;
            case 'break':
            case 'return':
                list += '\n';
                alias = 0;
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
    const fSkip = (a: string[]) => {
        if (a[0] === 'default')
            stateF = fMain;
    };

    let stateF: ((a: string[]) => void) | null = fStart;
    let arr: RegExpExecArray | null;
    while ((arr = re.exec(sfun)) !== null && stateF !== null) {
        // console.log(`arr[0]= ${arr[0]}`);
        let a = arr[0].split(/ ["\(]|[\);: "]/);
        stateF(a);
    }

    return list.trim();
}
