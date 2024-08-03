// Global functions and constants for recipe files

import { $ } from "bun"

/** Prints message to the console with the appropriate label */
export const msg = (message: string) => console.log('◇ ' + message.replaceAll('\n', '\n  '));
/** Prints message to the console with the appropriate label */
export const err = (message: string) => console.log('◆ ' + message.replaceAll('\n', '\n  '));

/** Prints the interpolated command to the console before executing it in $'...' */
export function p$(strings: TemplateStringsArray, ...expressions: any[]) {
    msg(expressions.reduce((a: string, exp, i) => a + (
        typeof exp === 'string' ? /\s/.test(exp) && !'\'"'.includes(exp[0]) ? `"${exp}"` : exp
            : typeof exp === 'number' ? exp.toString()
                : exp && 'raw' in exp ? exp.raw
                    : `{${exp}}`
    ) + strings[i + 1], '$ ' + strings[0]).replace(/\n[ \t]*/g, '\n  '));
    return $(strings, ...expressions);
}

/** Decodes \uXXXX sequences in multiline text into Unicode characters. */
export function decode_uXXXX(str: string) {
    const ru = /\\u[0-9a-fA-F]{4}/;
    const re = /("|\\(?!u[0-9a-fA-F]{4}))/g;
    return str.split('\n').map(s => !ru.test(s) ? s
        : JSON.parse(`"${s.replace(re, '\\$&')}"`)).join('\n');
}
