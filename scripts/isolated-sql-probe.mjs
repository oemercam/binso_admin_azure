// Loaded explicitly by the disposable HTTP test server, never by app entry points.
import fs from 'node:fs';
import pg from 'pg';
const filename=process.env.BINSO_ISOLATED_SQL_LOG;
if(!filename)throw new Error('Isolated SQL probe requires its private test output');
const original=pg.Client.prototype.query;
pg.Client.prototype.query=function(...args){
 const text=typeof args[0]==='string'?args[0]:args[0]?.text;
 if(text?.startsWith('select *,count(*) over()::int total_count')&&text.includes('billing_predecessors')){
  fs.writeFileSync(filename,JSON.stringify({text,values:typeof args[0]==='string'?args[1]:args[0].values}),{mode:0o600});
 }
 return original.apply(this,args);
};
