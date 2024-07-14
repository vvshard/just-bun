/** Global functions for just_bun.mjs files 
 * @module funcs  
*/

//@ts-check
import { $ } from "bun"

// csl and err are used in main.js: don't remove them. Only changes to labels are allowed.
/** Prints a message to the console with the appropriate label */
export const csl = (msg) => console.log('◇ ' + msg);
/** Prints a message to the console with the appropriate label */
export const err = (msg) => console.log('◆ ' + msg);

//-////////////////////////////////////////////////
//----//////--  user functions --//////----//////

export function decode_uXXXX(/**@type {string}*/ str) {
    const ru = /\\u[0-9a-fA-F]{4}/;
    const re = /("|\\(?!u[0-9a-fA-F]{4}))/g;
    return str.split('\n').map(s => !ru.test(s) ? s
        : JSON.parse(`"${s.replace(re, '\\$&')}"`)).join('\n');
}


//-////////////////////////////////////////////////
//----//////--  decorated $`...` --//////----//////

/** Prints the interpolated command to the console before executing it in $`...` */
export function p$(/**@type {TemplateStringsArray}*/ strings, ...expressions) {
    csl(expressions.reduce((a, exp, i) => a + (
        typeof exp === 'string' ? /\s/.test(exp) && !'\'"'.includes(exp[0]) ? `"${exp}"` : exp
            : typeof exp === 'number' ? exp.toString()
                : exp && 'raw' in exp ? exp.raw
                    : `{${exp}}`
    ) + strings[i + 1], '$ ' + strings[0].replace(/\s+/, '')));
    return $(strings, ...expressions);
}
