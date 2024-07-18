# just-bun

Это позволяет использовать [Bun Shell](https://bun.sh/docs/runtime/shell) для сохранения и запуска команд, специфичных для проекта по аналогии с [just](https://github.com/casey/just).   
Главным преимуществом по сравнению с **just** является то, что Bun Shell  бесшовно нанизывает shell-команды на сколь угодно изощренную логику, записанную на TypeScript с мощными средствами Bun-API, включающими в себя, в том числе, почти весь Node.js-API.

## Основное использование

Рецепты хранятся в файлах just_bun.ts в рукавах `switch(recipeName)` функции `export async function runRecipe(recipeName?: string, args = [])`.   
Пример файла just_bun.ts:
```ts
import { $ } from "bun";

export async function runRecipe(recipeName?: string, args = []) {
    switch (recipeName) {
        case '# compiling in debug mode and running the program': // comment for list
        case 'run': 
        case 'r': // recipeName alias
        case undefined: // default: for run without recipeName
            await $`cargo run`;
            break;
        case 'build_release':
        case 'b':
            await $`cargo build --release`;
            await $`echo "Result in: ${__dirname}/target/release"`;
            break;
        case '# run tests; args: [filter] [-1] // -1: in one thread':
        case 'test':
        case 't':
            await $`cargo test ${{raw: args.join(' ').replace('-1', '-- --test-threads=1')}}`;
            break;
        default:
            return console.log(`recipeName error: '${recipeName}'`);
    }
}
```
Теперь в рабочем каталоге содержащем этот just_bun.ts или его дочернем, команда в терминале `$ jb -l` выведет:
```
◇ List of recipes in ./just_bun.ts:
  run / r <default> # compiling in debug mode and running the program
  build_release / b 
  test / t # run tests; args: [filter] [-1] // -1: in one thread
```
Команда `$ jb run` или `$ jb r` или просто `$ jb` выполнит: `$ cargo run`.  
Команда `$ jb t -1` выполнит: `$ cargo test -- --test-threads=1`.

## Установка
