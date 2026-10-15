import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {moduleUrl,moneyModuleUrl} from './data-test-modules.mjs';
const source=(await fs.readFile('lib/statistics-period.ts','utf8')).replace("'./money'",JSON.stringify(moneyModuleUrl));
const {statisticBounds,aggregateStatistics,validBusinessDay,lineChartCoordinates}=await import(moduleUrl(source));
for(const day of ['','2026-02-29','2026-13-01','2026-02-30','2026-1-01','NaN'])assert.equal(validBusinessDay(day),false,day);
assert.equal(validBusinessDay('2024-02-29'),true);
for(const months of [1,3,6,12]){
 const bounds=statisticBounds({months,from:'',to:''},'2026-10-10');
 assert.equal(bounds.to,'2026-10-10');assert.equal(bounds.from,({1:'2026-10-01',3:'2026-08-01',6:'2026-05-01',12:'2025-11-01'})[months]);
}
for(const period of [{months:'custom',from:'',to:'2026-10-10'},{months:'custom',from:'2026-10-11',to:'2026-10-10'},{months:'custom',from:'2026-02-30',to:'2026-03-01'},{months:99,from:'',to:''}])assert.equal(statisticBounds(period,'2026-10-10'),null);
const events=[{date:'2026-10-01',values:{income:'0.10',costs:0}},{date:'2026-10-10',values:{income:'0.20',costs:'0.10'}},{date:'2026-10-11',values:{income:'90000',costs:0}}];
const actual=aggregateStatistics(events,{from:'2026-10-01',to:'2026-10-10'},['income','costs']);
assert.equal(actual.totals.income,0.3);assert.equal(actual.totals.costs,0.1);assert.equal(actual.resolution,'day');assert.equal(actual.buckets.length,10);
assert.equal(actual.buckets.at(-1).values.income,0.2,'Inclusive end day');
for(const [from,to,resolution] of [['2026-10-01','2026-10-31','week'],['2026-05-01','2026-10-10','month'],['2020-01-01','2026-10-10','year']]){
 const result=aggregateStatistics(events,{from,to},['income','costs']);assert.equal(result.resolution,resolution);assert.equal(result.totals.income,to==='2026-10-10'?0.3:90000.3);assert.ok(result.buckets.length<=24);
}
const long=aggregateStatistics([],{from:'1900-01-01',to:'9998-12-31'},['income']);assert.ok(long.buckets.length<=12,'Very long ranges remain bounded');assert.ok(long.buckets.every(bucket=>bucket.values.income===0),'No invented bars');
const cashSource=(await fs.readFile('lib/cash-statistics.ts','utf8')).replace("'./money'",JSON.stringify(moneyModuleUrl));const {cashStatisticEvents}=await import(moduleUrl(cashSource));
assert.deepEqual(cashStatisticEvents({payments:[{payment_date:'2026-10-10',amount:50}],outflows:[{payment_date:'2026-10-11',amount:20}]}),[{date:'2026-10-10',values:{income:50,costs:0}},{date:'2026-10-11',values:{income:0,costs:20}}]);
console.log('Central statistics: presets, inclusive dates, invalid dates, UTC/DST-independent groups, decimal precision, bounded long periods and cash mapping passed.');

// Exercise the actual chart component's touch/keyboard handlers and primary KPI limit.
const ts=(await import('typescript')).default;
const {createRequire}=await import('node:module'),require=createRequire(import.meta.url);
const React=await import('react');
const textComponent=({children})=>children;
const declaration=(file,text,name)=>{const ast=ts.createSourceFile(file,text,99,true,4);return ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name).getText(ast)};
const compileComponent=text=>ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const chartSource=await fs.readFile('components/statistics.tsx','utf8');
let selection=null;const ringExports={};
Function('require','exports','useState','formatCurrency','sumMoney','LocalizedText','Button',compileComponent(declaration('statistics.tsx',chartSource,'RingChart')))(require,ringExports,()=>[selection,value=>{selection=value}],amount=>'CHF '+amount.toFixed(2),values=>values.reduce((a,b)=>a+b,0),textComponent,textComponent);
const props={label:'Invoice status',parts:[{key:'paid',label:'Paid',tone:'positive',value:50},{key:'open',label:'Open',tone:'neutral',value:25,href:'/rechnungen?status=open'},{key:'empty',label:'Empty',tone:'negative',value:0}]};
const nodes=element=>!element||typeof element!=='object'?[]:[element,...React.Children.toArray(element.props?.children).flatMap(nodes)];
let chart=ringExports.RingChart(props),targets=nodes(chart).filter(n=>n.type==='circle'&&n.props.role==='button');
assert.equal(targets.length,2,'Zero-size segments do not create invisible keyboard targets');
targets[0].props.onClick();assert.equal(selection,'paid');
let prevented=false;targets[1].props.onKeyDown({key:' ',preventDefault(){prevented=true}});assert.equal(selection,'open');assert.equal(prevented,true);
selection=null;targets[1].props.onKeyDown({key:'ArrowRight',preventDefault(){throw Error('Unrelated key consumed')}});assert.equal(selection,null);
targets[1].props.onKeyDown({key:'Enter',preventDefault(){}});chart=ringExports.RingChart(props);
assert.ok(nodes(chart).some(n=>n.props?.href==='/rechnungen?status=open'),'Selected segment exposes its permission-aware drilldown button');
assert.ok(nodes(chart).some(n=>n.type==='output'&&JSON.stringify(n.props.children).includes('Open: CHF 25.00')),'Accessible output identifies amount and selected status');

let cursor=0;const states=[];const statisticsExports={};
const useState=initial=>{const i=cursor++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;const set=value=>{states[i]=typeof value==='function'?value(states[i]):value};return [states[i],set]};
const Tile=()=>null,Tiles=()=>null,Button=()=>null;
Function('require','exports','useId','useState','useEffect','businessDate','statisticBounds','aggregateStatistics','statisticPeriods','formatCurrency','MetricTiles','MetricTile','LocalizedText','LocalizedElement','Button','FilterSheet','Field','Input','ErrorState','Icon','RingChart','LineChart',compileComponent(declaration('statistics.tsx',chartSource,'Statistics')))(require,statisticsExports,()=>':metrics:',useState,()=>{},()=>'2026-10-15',statisticBounds,aggregateStatistics,[1,3,6,12],String,Tiles,Tile,textComponent,textComponent,Button,()=>null,()=>null,()=>null,()=>null,()=>null,ringExports.RingChart,()=>null);
const render=()=>{cursor=0;return statisticsExports.Statistics({title:'Statistics',subtitle:'Synthetic',storageKey:'test',events:[],series:[],metrics:()=>Array.from({length:6},(_,i)=>({label:'Metric '+i,value:i===0?-125:i}))})};
let statistics=render();
const tileGroups=nodes(statistics).filter(n=>n.type===Tiles);assert.equal(React.Children.count(tileGroups[0].props.children),4,'Only four primary KPIs');assert.equal(React.Children.count(tileGroups[1].props.children),2,'Remaining KPIs use the shared renderer');
assert.equal(React.Children.toArray(tileGroups[0].props.children)[0].props.value,'-125','Negative metrics are not clamped or hidden');
let disclosure=nodes(statistics).find(n=>n.type===Button&&n.props['aria-controls']===':metrics:-more-metrics');assert.equal(disclosure.props['aria-expanded'],false);
assert.equal(nodes(statistics).find(n=>n.props?.id===':metrics:-more-metrics').props.hidden,true);
disclosure.props.onClick();statistics=render();assert.equal(nodes(statistics).find(n=>n.props?.id===':metrics:-more-metrics').props.hidden,false,'Disclosure reveals additional metrics');
console.log('Actual chart and shared KPI foundation: pointer/Enter/Space, zero segments, selected status/amount, drilldown, four primary metrics, negative values and accessible disclosure passed.');

const {PGlite}=await import('@electric-sql/pglite');
const financeDb=new PGlite();
try{
 await financeDb.exec(`create table invoices(id text,organization_id text,currency text,status text,archived_at timestamptz,issue_date date,due_date date,total_amount numeric(14,2),paid_amount numeric(14,2),customer_id uuid);create table credit_notes(invoice_id text,organization_id text,credit_date date,amount numeric(14,2));create table invoice_refunds(invoice_id text,organization_id text,refund_date date,amount numeric(14,2));`);
 const today=(await financeDb.query("select (now() at time zone 'Europe/Zurich')::date::text as business_day")).rows[0].business_day;
 await financeDb.exec(`insert into invoices(id,organization_id,currency,status,archived_at,issue_date,due_date,total_amount,paid_amount) values
 ('partial','a','CHF','partial',null,current_date-10,current_date-1,100,50),
 ('paid','a','CHF','paid',null,current_date-10,current_date+10,200,200),
 ('open','a','CHF','sent',null,current_date-10,current_date+10,300,0),
 ('draft','a','CHF','draft',null,current_date,current_date+1,1000,0),
 ('cancel','a','CHF','cancelled',null,current_date,current_date+1,1000,0),
 ('archived','a','CHF','sent',now(),current_date,current_date+1,1000,0),
 ('foreign-currency','a','EUR','sent',null,current_date,current_date+1,1000,0),
 ('future','a','CHF','sent',null,current_date+10,current_date+20,1000,0),
 ('other-tenant','b','CHF','sent',null,current_date,current_date+1,99999,0);
 insert into credit_notes values('partial','a',current_date,20),('partial','a',current_date+1,30),('partial','b',current_date,500);`);
 const financeSource=(await fs.readFile('lib/server/repositories/finance.ts','utf8')).replace("import 'server-only';",'');
 const {financialMetricsData}=await import(moduleUrl(financeSource));
 const result=await financialMetricsData(financeDb,'a');
 assert.equal(result.snapshot.as_of,today);assert.equal(Number(result.snapshot.paid),250);assert.equal(Number(result.snapshot.open),300);assert.equal(Number(result.snapshot.overdue),30);assert.equal(Number(result.snapshot.credit_balance),0);
 assert.equal(result.revenueEvents.reduce((total,row)=>total+Number(row.amount),0),580,'Issued gross volume minus current credit notes; never payment receipts');
 assert.ok(result.revenueEvents.some(row=>Number(row.amount)===-20),'Credit date remains a real negative revenue event');
 await financeDb.exec("insert into credit_notes values('paid','a',current_date,100)");
 const credited=await financialMetricsData(financeDb,'a');assert.equal(Number(credited.snapshot.paid),150);assert.equal(Number(credited.snapshot.credit_balance),100,'Credit after full payment is exposed as credit balance, not a negative receivable');
 assert.equal(Number(credited.snapshot.paid)+Number(credited.snapshot.open)+Number(credited.snapshot.overdue),480,'Ring segments form one adjusted invoice volume');
 await financeDb.exec("insert into invoice_refunds values('paid','a',current_date,60),('paid','a',current_date+1,30),('paid','b',current_date,999)");
 const repaid=await financialMetricsData(financeDb,'a');
 assert.equal(Number(repaid.snapshot.credit_balance),40,'Only actual current-tenant repayments reduce customer credit');
 assert.equal(repaid.snapshot.receivables,credited.snapshot.receivables,'Refunds do not manufacture new receivables');
 assert.deepEqual(repaid.revenueEvents,credited.revenueEvents,'Credit note already corrected revenue; refund must not correct it again');
 assert.deepEqual(cashStatisticEvents({refunds:[{payment_date:today,amount:60}]}),[{date:today,values:{income:-60,costs:0}}],'A refund is a negative receipt on the actual repayment date');
 const empty=await financialMetricsData(financeDb,'empty');assert.equal(empty.revenueEvents.length,0);for(const key of ['paid','open','overdue','credit_balance'])assert.equal(Number(empty.snapshot[key]),0);
 const {listStatusOverride}=await import(moduleUrl(await fs.readFile('lib/list-filter.ts','utf8')));
 assert.equal(listStatusOverride('?status='+encodeURIComponent('Überfällig'),['Alle','Überfällig']),'Überfällig');assert.equal(listStatusOverride('?status=unknown',['Alle']),undefined);assert.equal(listStatusOverride('?status=https://foreign.invalid',['Alle']),undefined);
 console.log('Actual PostgreSQL metric queries: CHF/tenant/date/status/archive scope, credits on their own dates, partial payments, current due balance, credit liability and ring reconciliation passed. Whitelisted list drilldowns passed. Real external runtime-role testing remains separate.');
}finally{await financeDb.close()}

const signed=lineChartCoordinates([{key:'a',label:'A',from:'',to:'',values:{amount:-10}},{key:'b',label:'B',from:'',to:'',values:{amount:0}},{key:'c',label:'C',from:'',to:'',values:{amount:10}}],['amount']);
assert.equal(signed.zeroY,80);assert.deepEqual(signed.paths[0].points.map(p=>p.y),[148,80,12]);assert.deepEqual(signed.paths[0].points.map(p=>p.x),[12,300,588]);
assert.equal(lineChartCoordinates([{key:'one',label:'One',from:'',to:'',values:{amount:1}}],['amount']).paths[0].points[0].x,300);
assert.throws(()=>lineChartCoordinates([{key:'bad',label:'Bad',from:'',to:'',values:{amount:NaN}}],['amount']),/finite/);
console.log('Signed time-series geometry preserves negative/zero/positive ordering and a true zero baseline, centers a sole observation and rejects invalid values.');
const lineExports={};
Function('require','exports','lineChartCoordinates','LocalizedElement','LocalizedText',compileComponent(declaration('statistics.tsx',chartSource,'LineChart')))(require,lineExports,lineChartCoordinates,textComponent,textComponent);
let chosen;const lineBuckets=[{key:'a',label:'A',from:'',to:'',values:{amount:-10}},{key:'b',label:'B',from:'',to:'',values:{amount:0}},{key:'c',label:'C',from:'',to:'',values:{amount:10}}];
const actualLine=lineExports.LineChart({buckets:lineBuckets,series:[{key:'amount',label:'Amount',tone:'neutral'}],selected:null,onSelect:key=>{chosen=key},value:String});
assert.equal(nodes(actualLine).find(n=>n.type==='svg').props.preserveAspectRatio,'none','Pointer coordinates map to the complete chart viewport without hidden letterboxing');
const lineNodes=nodes(actualLine),points=lineNodes.filter(n=>n.props?.as==='circle');assert.equal(points.length,3);assert.equal(points[0].props.cy,148);assert.ok(points[0].props['aria-label'].includes('-10'));
points[1].props.onKeyDown({key:'Enter',preventDefault(){}});assert.equal(chosen,'b');let stopped=false;points[0].props.onClick({stopPropagation(){stopped=true}});assert.equal(stopped,true);assert.equal(chosen,'a');
lineNodes.find(n=>n.type==='svg').props.onClick({clientX:598,currentTarget:{getBoundingClientRect:()=>({left:10,width:600})}});assert.equal(chosen,'c','A tap anywhere in a chart column chooses its nearest real observation');
console.log('Actual shared line chart: signed plotted coordinates, accessible negative values, keyboard/pointer selection and full-chart nearest-observation hit testing passed.');
