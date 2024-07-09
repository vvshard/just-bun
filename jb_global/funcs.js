

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
