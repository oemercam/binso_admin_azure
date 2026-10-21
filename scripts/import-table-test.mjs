import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ExcelJS from 'exceljs';
import {moduleUrl} from './data-test-modules.mjs';
import {readWorkbook} from '../lib/server/spreadsheet-import.mjs';
const {parseDelimited}=await import(moduleUrl(await fs.readFile('lib/import-table.ts','utf8')));
assert.deepEqual(parseDelimited('Name;Ort\r\n"Firma; AG";"Zürich"\r\n'),[['Name','Ort'],['Firma; AG','Zürich']]);
assert.deepEqual(parseDelimited('A,B\n"one\nline","two""quoted"'),[['A','B'],['one\nline','two"quoted']]);
assert.deepEqual(parseDelimited('\uFEFFA\tB\n1\t2'),[['A','B'],['1','2']]);
for(const text of ['A,B\n"unclosed,2','A,B\n1,2,3','A,B\n1,\0','A,B\n1,"a"X','A\n'+('x\n'.repeat(501))])assert.throws(()=>parseDelimited(text));
const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('Kunden');sheet.addRows([['Firma','Vorname','Nachname'],['Synthetic AG','Test','Person']]);
sheet.addConditionalFormatting({ref:'A2',rules:[{type:'containsText',operator:'containsText',text:'Synthetic',style:{font:{bold:true}}}]});
const buffer=Buffer.from(await book.xlsx.writeBuffer()),parsed=await readWorkbook(buffer);assert.deepEqual(parsed.rows,[['Firma','Vorname','Nachname'],['Synthetic AG','Test','Person']]);assert.equal(parsed.sheet,'Kunden');
await assert.rejects(readWorkbook(Buffer.from('not xlsx')));await assert.rejects(readWorkbook(Buffer.alloc(3*1024*1024+1)),/import_limit/);
const formulas=new ExcelJS.Workbook(),formulaSheet=formulas.addWorksheet('Unsafe');formulaSheet.addRow(['Name']);formulaSheet.getCell('A2').value={formula:'1+1',result:2};await assert.rejects(readWorkbook(Buffer.from(await formulas.xlsx.writeBuffer())),/xlsx_unsupported/);
const links=new ExcelJS.Workbook(),linked=links.addWorksheet('Links');linked.addRow(['Name']);linked.getCell('A2').value={text:'link',hyperlink:'https://example.invalid'};await assert.rejects(readWorkbook(Buffer.from(await links.xlsx.writeBuffer())),/xlsx_unsupported/);
console.log('Bounded imports: UTF-8/delimiters/quoted multiline/escaped quotes, malformed/oversized rejection, actual XLSX/conditional-format compatibility, formula/external-link denial passed.');

const sourceRows=[];parseDelimited('\nA,B\n"multi\nline",value\n\nlast,row',sourceRows);assert.deepEqual(sourceRows,[2,3,6],'Error reports retain physical source rows across blank and multiline records');
