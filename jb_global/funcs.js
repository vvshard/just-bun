
export function decode_uXXXX(/**@type {string}*/ str){
    const ru = /\\u[0-9a-fA-F]{4}/;
    const re = /("|\\(?!u[0-9a-fA-F]{4}))/g;
    return str.split('\n').map(s => !ru.test(s) ? s
        : JSON.parse(`"${s.replace(re, '\\$&')}"`)).join('\n');
}

//-////////////////////////////////////////////////
//----//////--  decorated $`...` --//////----//////

/** Prints the interpolated command to the console before executing it in $\`...\` */
export function p$(/**@type {TemplateStringsArray}*/ strings, ...expressions) {
    console.log(expressions.reduce((a, exp, i) => a + (
        typeof exp === 'string' ? `"${exp}"`
            : typeof exp === 'number' ? exp.toString()
                : exp && 'raw' in exp ? exp.raw
                    : `{${exp}}`
    ) + strings.raw[i + 1], 'BunSell_$ ' + strings.raw[0]));
    return $(strings, ...expressions);
}


