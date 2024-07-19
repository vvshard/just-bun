# just-bun

Это позволяет использовать [Bun Shell](https://bun.sh/docs/runtime/shell) для сохранения и запуска команд, специфичных для проекта, по аналогии с [just](https://github.com/casey/just).   
Главным преимуществом по сравнению с **just** является то, что Bun Shell  бесшовно нанизывает shell-команды на сколь угодно изощренную логику, написанную на TypeScript с мощными средствами Bun-API, включающими в себя, в том числе, почти весь Node.js-API.

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
        case '# run tests; args: [<filter>] [-1] // -1: in one thread':
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
  test / t # run tests; args: [<filter>] [-1] // -1: in one thread
```
Команда `$ jb run` или `$ jb r` или просто `$ jb` выполнит: `$ cargo run`.  
Команда `$ jb t add -1` выполнит: `$ cargo test add -- --test-threads=1`.

Если вам удобнее, имя файла рецептов может иметь спереди точку и любой регистр букв до расширения. Например, Just_Bun.ts и .JUST_BUN.ts являются допустимыми именами.

## Установка

1. Установите [Bun](https://bun.sh/), если его ещё нет в вашей системе.
1. Скопируйте из этого репозитария папку jb_script в удобное для вас место на вашем компьютере. Можно её переименовать, но далее эту папку здесь обозначаю `jb_script/`.
1. Создайте короткий удобный alias для команды `$ bun <path to jb_script/>/main.js` вашей основной оболочки. Здесь этот alias я буду обозначать `jb`.    
В безопасности запуска jb_script/main.js легко убедиться: он содержит менее 300 строк, хорошо читаем и импортирует только "path" из bun и runRecipe() из ваших just_bun.ts.  
Если в вашей системе установлен [Rust](https://www.rust-lang.org/), то вместо создания alias'а оболочки, можете скомпелировать исполняемый файл jb (jb.exe для Windows) из папки bun_script_alias репозитария и поместить его в любую папку из env PATH (напримеp в ~/.bun/bin или в ~/.cargo/bin). Единственное, что он делает - вызывает `$ bun <path to jb>/../jb_script/main.js` с переданными ему аргументами. Тогда папку jb_script/ необходимо поместить рядом с папкой, куда вы положили файл jb. При желани, можете синхронно переименовать файл и папку в более удобное для вызова имя, например - в **j** (**j.exe** для Windows) и **j_script**/ соответственно.
1. На этом этапе уже всё работает, но вашему редактору кода требуются объявления @types/bun для автодополнений и контроля типов из Bun-API при редактировании файлов just_bun.ts.   
Для этого перейдите в терминале в корневой каталог проектов, в которых вы будете использовать just_bun.ts и введите `$ jb -@`. Это создаст / обновит здесь папку node_modules/ с объявлениями @types/bun.

## Формат и флаги командной строки

Этот раздел так же можно прочитать по команде `$ jb -h` или `$ jb --help`





