import { $ } from 'bun'

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
    console.log(expressions.reduce((a, exp, i) => a + (
        typeof exp === 'string' ? /\s/.test(exp) && !'\'"'.includes(exp[0]) ? `"${exp}"` : exp
            : typeof exp === 'number' ? exp.toString()
                : exp && 'raw' in exp ? exp.raw
                    : `{${exp}}`
    ) + strings[i + 1], '◇ $ ' + strings[0]));
    return $(strings, ...expressions);
}
