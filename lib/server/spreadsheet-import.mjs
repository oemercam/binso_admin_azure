import 'exceljs'; // Keep the existing standalone dependency tracer aware of the worker dependency.
import {Worker} from 'node:worker_threads';
import {createRequire} from 'node:module';
import {join} from 'node:path';
let running=0;
const workerSource=String.raw`
const {parentPort,workerData}=require('node:worker_threads');
const {inflateRawSync}=require('node:zlib');
(async()=>{
 const bytes=Buffer.from(workerData.bytes);let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(bytes.readUInt32LE(i)===0x06054b50&&i+22+bytes.readUInt16LE(i+20)===bytes.length){end=i;break;}
 if(end<0||bytes.readUInt16LE(end+4)||bytes.readUInt16LE(end+6))throw Error('invalid_xlsx');
 const count=bytes.readUInt16LE(end+10),central=bytes.readUInt32LE(end+16),size=bytes.readUInt32LE(end+12);
 if(!count||count>200||bytes.readUInt16LE(end+8)!==count||central+size!==end)throw Error('import_limit');
 let at=central,total=0;const names=new Set();
 for(let i=0;i<count;i++){
  if(at+46>bytes.length||bytes.readUInt32LE(at)!==0x02014b50)throw Error('invalid_xlsx');
  const flags=bytes.readUInt16LE(at+8),method=bytes.readUInt16LE(at+10),packed=bytes.readUInt32LE(at+20),unpacked=bytes.readUInt32LE(at+24),length=bytes.readUInt16LE(at+28),extra=bytes.readUInt16LE(at+30),comment=bytes.readUInt16LE(at+32),local=bytes.readUInt32LE(at+42);
  if(at+46+length+extra+comment>central+size)throw Error('invalid_xlsx');
  const name=bytes.subarray(at+46,at+46+length).toString('utf8');
  if(names.has(name)||name.includes('..')||name.startsWith('/')||name.includes(String.fromCharCode(92))||/externalLinks|vbaProject|\.bin$/i.test(name)||flags&1||![0,8].includes(method))throw Error('xlsx_unsupported');names.add(name);
  total+=unpacked;if(unpacked>8*1024*1024||total>16*1024*1024||local+30>central||bytes.readUInt32LE(local)!==0x04034b50)throw Error('import_limit');
  const start=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28);if(start+packed>central)throw Error('invalid_xlsx');
  const data=method===0?bytes.subarray(start,start+packed):inflateRawSync(bytes.subarray(start,start+packed),{maxOutputLength:8*1024*1024});
  if(data.length!==unpacked)throw Error('invalid_xlsx');
  if(/\.(xml|rels)$/i.test(name)){const xml=new TextDecoder('utf-8',{fatal:true}).decode(data);if(xml.includes(String.fromCharCode(0))||/<!DOCTYPE|<!ENTITY|TargetMode\s*=\s*["']External/i.test(xml))throw Error('xlsx_unsupported');}
  at+=46+length+extra+comment;
 }
 if(at!==central+size)throw Error('invalid_xlsx');
 const ExcelJS=require(workerData.modulePath),book=new ExcelJS.Workbook();await book.xlsx.load(bytes,{ignoreNodes:['drawing','picture','extLst']});
 const sheets=book.worksheets.filter(sheet=>sheet.state==='visible');if(!sheets.length)throw Error('import_empty');
 const sheet=workerData.sheet?sheets.find(sheet=>sheet.name===workerData.sheet):sheets[0];if(!sheet)throw Error('sheet_invalid');
 if(sheet.rowCount>501||sheet.columnCount>32)throw Error('import_limit');
 const rows=[],rowNumbers=[];sheet.eachRow({includeEmpty:false},row=>{
  const result=[];for(let column=1;column<=sheet.columnCount;column++){
   const cell=row.getCell(column),value=cell.value;let text='';
   if(value===null||value===undefined)text='';else if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')text=String(value);else if(value instanceof Date)text=value.toISOString().slice(0,10);else if(Array.isArray(value.richText))text=value.richText.map(run=>run.text).join('');else throw Error('xlsx_unsupported');
   if(text.length>2000)throw Error('import_limit');result.push(text);
  }if(result.some(value=>value.trim())){rows.push(result);rowNumbers.push(row.number);}
 });
 if(rows.length<2)throw Error('import_empty');parentPort.postMessage({sheets:sheets.map(sheet=>sheet.name),sheet:sheet.name,rows,rowNumbers});
})().catch(error=>parentPort.postMessage({error:['invalid_xlsx','import_limit','xlsx_unsupported','import_empty','sheet_invalid'].includes(error.message)?error.message:'invalid_xlsx'}));
`;
/** XLSX parsing is bounded by compressed/uncompressed bytes, cells, time and worker heap.
 * No app credentials enter the worker environment; no workbook scripts/formulas run. */
export async function readWorkbook(bytes,sheet=''){
 if(bytes.length>3*1024*1024)throw Error('import_limit');if(running>=2)throw Error('import_busy');running++;
 try{return await new Promise((resolve,reject)=>{
  const worker=new Worker(workerSource,{eval:true,workerData:{bytes,modulePath:createRequire(join(process.cwd(),'package.json')).resolve('exceljs'),sheet},env:{NODE_ENV:'production'},resourceLimits:{maxOldGenerationSizeMb:64,maxYoungGenerationSizeMb:16,stackSizeMb:2}});
  const timer=setTimeout(()=>{void worker.terminate();reject(Error('import_timeout'));},8000);
  const finish=()=>{clearTimeout(timer);void worker.terminate();};
  worker.once('message',message=>{finish();if(message.error)reject(Error(message.error));else resolve(message);});
  worker.once('error',()=>{finish();reject(Error('invalid_xlsx'));});
  worker.once('exit',code=>{clearTimeout(timer);if(code)reject(Error('invalid_xlsx'));});
 });}finally{running--;}
}
