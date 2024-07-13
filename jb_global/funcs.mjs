import { $ } from 'bun'

// сl is used in main.js: do not remove it or change its type
/** Prints a message to the console with the appropriate label */
export const cl = {
    nrm: (msg) => console.log('◇ ' + msg),
    err: (msg) => console.log('◆ ' + msg),
}

//-////////////////////////////////////////////////

export function decode_uXXXX(/**@type {string}*/ str) {
    const ru = /\\u[0-9a-fA-F]{4}/;
    const re = /("|\\(?!u[0-9a-fA-F]{4}))/g;
    return str.split('\n').map(s => !ru.test(s) ? s
        : JSON.parse(`"${s.replace(re, '\\$&')}"`)).join('\n');
}


//-////////////////////////////////////////////////
//----//////--  decorated $`...` --//////----//////

/** Prints the interpolated command to the console before executing it in $\`...\` */
export function p$(/**@type {TemplateStringsArray}*/ strings, ...expressions) {
    cl.nrm(expressions.reduce((a, exp, i) => a + (
        typeof exp === 'string' ? /\s/.test(exp) && !'\'"'.includes(exp[0]) ? `"${exp}"` : exp
            : typeof exp === 'number' ? exp.toString()
                : exp && 'raw' in exp ? exp.raw
                    : `{${exp}}`
    ) + strings[i + 1], '$ ' + strings[0].replace(/\s+/, '')));
    return $(strings, ...expressions);
}
