import fs from 'node:fs/promises';
import ts from 'typescript';
export const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText).toString('base64');
export const moneyModuleUrl=moduleUrl(await fs.readFile('lib/money.ts','utf8'));
export const financialModuleUrl=moduleUrl((await fs.readFile('lib/financial-status.ts','utf8')).replace('"./money"',JSON.stringify(moneyModuleUrl)));
