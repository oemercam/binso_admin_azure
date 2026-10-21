import fs from 'node:fs/promises';
import ts from 'typescript';
export const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText).toString('base64');
export const planCatalogModuleUrl=moduleUrl(await fs.readFile('config/plans.ts','utf8'));
export const planAccessModuleUrl=moduleUrl((await fs.readFile('config/plan-access.ts','utf8')).replace("'./plans'",JSON.stringify(planCatalogModuleUrl)));
export const moneyModuleUrl=moduleUrl(await fs.readFile('lib/money.ts','utf8'));
export const financialModuleUrl=moduleUrl((await fs.readFile('lib/financial-status.ts','utf8')).replace('"./money"',JSON.stringify(moneyModuleUrl)));
export const displayModuleUrl=moduleUrl((await fs.readFile('lib/display-format.ts','utf8')).replace('"./financial-status"',JSON.stringify(financialModuleUrl)));
export const documentAmountSqlModuleUrl=moduleUrl((await fs.readFile('lib/server/document-amount-sql.ts','utf8')).replace("import 'server-only';",''));

let localeModule;
export async function localeTestModuleUrl(){
 if(localeModule)return localeModule;
 const config=moduleUrl(await fs.readFile('lib/locales/config.ts','utf8'));
 localeModule=moduleUrl((await fs.readFile('lib/locales/index.ts','utf8')).replace("import catalogue from './messages.json';",'const catalogue='+await fs.readFile('lib/locales/messages.json','utf8')+';').replace('import pluralCatalogue from "./plurals.json";','const pluralCatalogue='+await fs.readFile('lib/locales/plurals.json','utf8')+';').replace('import templateCatalogue from "./templates.json";','const templateCatalogue='+await fs.readFile('lib/locales/templates.json','utf8')+';').replaceAll('"./config"',JSON.stringify(config)));
 return localeModule;
}
