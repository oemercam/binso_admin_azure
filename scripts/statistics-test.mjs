import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {moduleUrl,moneyModuleUrl,financialModuleUrl} from './data-test-modules.mjs';
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
const cashSource=(await fs.readFile('lib/cash-statistics.ts','utf8')).replace("'./money'",JSON.stringify(moneyModuleUrl));const {cashStatisticEvents,financialStatisticEvents}=await import(moduleUrl(cashSource));
assert.deepEqual(cashStatisticEvents({payments:[{payment_date:'2026-10-10',amount:50}],outflows:[{payment_date:'2026-10-11',amount:20}]}),[{date:'2026-10-10',values:{income:50,costs:0}},{date:'2026-10-11',values:{income:0,costs:20}}]);
console.log('Central statistics: presets, inclusive dates, invalid dates, UTC/DST-independent groups, decimal precision, bounded long periods and cash mapping passed.');

// Exercise the actual chart component's touch/keyboard handlers and primary KPI limit.
const ts=(await import('typescript')).default;
const {createRequire}=await import('node:module'),require=createRequire(import.meta.url);
const React=await import('react');
const {renderToStaticMarkup}=await import('react-dom/server');
const textComponent=({children})=>children;
const declaration=(file,text,name)=>{const ast=ts.createSourceFile(file,text,99,true,4);return ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name).getText(ast)};
const compileComponent=text=>ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const chartSource=await fs.readFile('components/statistics.tsx','utf8');
const actionExports={};
Function('require','exports',compileComponent(declaration('ui.tsx',await fs.readFile('components/ui.tsx','utf8'),'FormActions')))(require,actionExports);
let selection=null,activeLocale='de';const localeTags={de:'de-CH',fr:'fr-CH',it:'it-CH',en:'en-CH'},useLocale=()=>({locale:activeLocale});const ringExports={};
const ringTranslate=value=>activeLocale==='fr'?({'Invoice status':'Statut des factures',Open:'Ouvert'}[value]??value):value;
const ringText=({children})=>typeof children==='string'?ringTranslate(children):children;
Function('require','exports','useState','formatCurrency','sumMoney','LocalizedText','Button','useTranslation','useLocale','localeTags',compileComponent(declaration('statistics.tsx',chartSource,'RingChart')))(require,ringExports,()=>[selection,value=>{selection=value}],amount=>'CHF '+amount.toFixed(2),values=>values.reduce((a,b)=>a+b,0),ringText,textComponent,()=>ringTranslate,useLocale,localeTags);
const props={label:'Invoice status',parts:[{key:'paid',label:'Paid',tone:'positive',value:50},{key:'open',label:'Open',tone:'neutral',value:25,href:'/rechnungen?status=open'},{key:'empty',label:'Empty',tone:'negative',value:0}]};
const nodes=element=>!element||typeof element!=='object'?[]:[element,...React.Children.toArray(element.props?.children).flatMap(nodes)];
let chart=ringExports.RingChart(props),targets=nodes(chart).filter(n=>n.type==='circle'&&n.props.role==='button');
assert.ok(nodes(chart).filter(n=>n.type==='title').every(n=>typeof n.props.children==='string'),'SVG titles use translated plain text, never React elements');
assert.equal(targets.length,2,'Zero-size segments do not create invisible keyboard targets');
targets[0].props.onClick();assert.equal(selection,'paid');
let prevented=false;targets[1].props.onKeyDown({key:' ',preventDefault(){prevented=true}});assert.equal(selection,'open');assert.equal(prevented,true);
selection=null;targets[1].props.onKeyDown({key:'ArrowRight',preventDefault(){throw Error('Unrelated key consumed')}});assert.equal(selection,null);
targets[1].props.onKeyDown({key:'Enter',preventDefault(){}});chart=ringExports.RingChart(props);
assert.ok(nodes(chart).some(n=>n.props?.href==='/rechnungen?status=open'),'Selected segment exposes its permission-aware drilldown button');
assert.match(renderToStaticMarkup(nodes(chart).find(n=>n.type==='output')),/>Open: CHF 25\.00</,'Accessible output identifies amount and selected status');
activeLocale='fr';const frenchRing=ringExports.RingChart(props);assert.equal(nodes(frenchRing).find(n=>n.type==='svg').props['aria-label'],'Statut des factures: CHF 75.00');assert.match(renderToStaticMarkup(nodes(frenchRing).find(n=>n.type==='output')),/>Ouvert: CHF 25\.00</,'Selected label is translated independently of the formatted amount');activeLocale='de';

let cursor=0;const states=[];const statisticsExports={};
const useState=initial=>{const i=cursor++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;const set=value=>{states[i]=typeof value==='function'?value(states[i]):value};return [states[i],set]};
const Tile=()=>null,Tiles=()=>null,Button=()=>null;
const pickerExports={},pickerState=[true,false,{months:'custom',from:'2026-10-01',to:'2026-10-15'}];let pickerCursor=0;
Function('require','exports','useId','useState','useEffect','useLocale','useTranslation','businessDate','statisticBounds','statisticPeriods','localeTags','labels','LocalizedText','LocalizedElement','Icon','Input','Field','Button','ErrorState','FormActions','FilterSheet','HeaderPanel',compileComponent(declaration('statistic-period-picker.tsx',await fs.readFile('components/statistic-period-picker.tsx','utf8'),'StatisticPeriodPicker')))(require,pickerExports,()=>':period:',()=>[pickerState[pickerCursor++%3],()=>{}],()=>{},useLocale,()=>value=>value,()=>'2026-10-15',statisticBounds,[1,3,6,12],localeTags,{1:'Current month',3:'Last 3 months',6:'Last 6 months',12:'Last 12 months'},textComponent,textComponent,()=>null,'input',({children})=>children,Button,()=>null,actionExports.FormActions,()=>null,()=>null);
Function('require','exports','useId','useState','businessDate','statisticBounds','aggregateStatistics','formatCurrency','MetricTiles','MetricTile','LocalizedText','Button','RingChart','LineChart','useLocale','localeTags','useStatisticPeriod','StatisticPeriodPicker',compileComponent(declaration('statistics.tsx',chartSource,'Statistics')))(require,statisticsExports,()=>':metrics:',useState,()=>'2026-10-15',statisticBounds,aggregateStatistics,String,Tiles,Tile,textComponent,Button,ringExports.RingChart,()=>null,useLocale,localeTags,(_key,initial)=>[initial,()=>{}],pickerExports.StatisticPeriodPicker);
statisticsExports.StatisticPeriodPicker=pickerExports.StatisticPeriodPicker;
const render=()=>{cursor=0;return statisticsExports.Statistics({title:'Statistics',subtitle:'Synthetic',storageKey:'test',events:[],series:[],metrics:()=>Array.from({length:6},(_,i)=>({label:'Metric '+i,value:i===0?-125:i}))})};
let statistics=render();
const pickerNode=nodes(statistics).find(n=>n.type===statisticsExports.StatisticPeriodPicker);assert.ok(pickerNode,'Statistics uses the shared period owner');
const picker=pickerNode.type(pickerNode.props);assert.equal(nodes(picker).filter(n=>n.type===actionExports.FormActions&&n.props.sheet).length,1,'Shared period picker uses the actual central sheet footer');
const tileGroups=nodes(statistics).filter(n=>n.type===Tiles);assert.equal(React.Children.count(tileGroups[0].props.children),4,'Only four primary KPIs');assert.equal(React.Children.count(tileGroups[1].props.children),2,'Remaining KPIs use the shared renderer');
assert.equal(React.Children.toArray(tileGroups[0].props.children)[0].props.value,-125,'Negative metrics are passed unchanged to the shared money renderer');
assert.equal(React.Children.toArray(tileGroups[0].props.children)[0].props.currency,'CHF','The shared renderer receives the original currency');
let disclosure=nodes(statistics).find(n=>n.type===Button&&n.props['aria-controls']===':metrics:-more-metrics');assert.equal(disclosure.props['aria-expanded'],false);
assert.equal(nodes(statistics).find(n=>n.props?.id===':metrics:-more-metrics').props.hidden,true);
disclosure.props.onClick();statistics=render();assert.equal(nodes(statistics).find(n=>n.props?.id===':metrics:-more-metrics').props.hidden,false,'Disclosure reveals additional metrics');
console.log('Actual chart and shared KPI foundation: pointer/Enter/Space, zero segments, selected status/amount, drilldown, four primary metrics, negative values and accessible disclosure passed.');

// Render the actual fallback overview: preserve geometry without fabricating invoice volume.
const {previousStatisticBounds,metricTrend}=await import(moduleUrl(await fs.readFile('lib/kpi-trend.ts','utf8')));
const overviewExports={},CreditRow=()=>null;
Function('require','exports','useState','useEffect','businessDate','financialStatisticEvents','statisticBounds','aggregateStatistics','MetricTiles','MetricTile','LocalizedText','Select','SectionTitle','sumMoney','formatCurrency','ListRow','EmptyState','useTranslation','previousStatisticBounds','metricTrend','StatisticPeriodPicker','formatDate','useStatisticPeriod',compileComponent(declaration('cash-statistics.tsx',await fs.readFile('components/cash-statistics.tsx','utf8'),'CashOverview')))(require,overviewExports,initial=>[typeof initial==='function'?initial():initial,()=>{}],()=>{},()=>'2026-10-15',financialStatisticEvents,statisticBounds,aggregateStatistics,Tiles,Tile,textComponent,'select',()=>null,(await import(moneyModuleUrl)).sumMoney,String,CreditRow,()=>null,()=>value=>value,previousStatisticBounds,metricTrend,()=>null,String,()=>[{months:1,from:'',to:''},()=>{}]);
const fallback=overviewExports.CashOverview({dashboard:true,data:{payments:[{payment_date:'2026-10-10',amount:50}],outflows:[{payment_date:'2026-10-11',amount:20}]}});
const fallbackMetrics=nodes(fallback).filter(node=>node.type===Tile).map(node=>node.props);
assert.deepEqual(fallbackMetrics.map(metric=>metric.label),['Umsatz','Eingänge','Ausgaben','Saldo']);
assert.deepEqual(fallbackMetrics.map(metric=>metric.value),['—',50,20,30],'Missing invoice volume remains unknown; known cash is counted once');
const creditOverview=overviewExports.CashOverview({dashboard:true,data:{payments:[{payment_date:'2026-10-10',amount:110}],outflows:[],financial:{revenueEvents:[{date:'2026-10-10',amount:100}],snapshot:{as_of:'2026-10-15',paid:100,open:0,overdue:0,credit_balance:10}}}});
const creditRow=nodes(creditOverview).find(node=>node.type===CreditRow);assert.ok(creditRow);assert.equal(creditRow.props.title,'Kundenguthaben');assert.equal(creditRow.props.value,'10');assert.equal(creditRow.props.href,'/rechnungen?status='+encodeURIComponent('Überbezahlt'));assert.equal(nodes(creditOverview).find(node=>node.type===Tile&&node.props.label==='Umsatz').props.value,100,'Customer credit is separate from billed volume');assert.ok(!nodes(fallback).some(node=>node.type===CreditRow),'No empty credit row');
const incompleteOverview=overviewExports.CashOverview({dashboard:true,data:{incomplete:true,payments:[],outflows:[]}});
assert.ok(nodes(incompleteOverview).some(node=>node.type==='p'&&JSON.stringify(node.props.children).includes('nur nachgewiesene Zahlungen')),'Dashboard must not hide incomplete outflow evidence');


const {PGlite}=await import('@electric-sql/pglite');
const financeDb=new PGlite();
try{
 await financeDb.exec(`create table invoices(id text,organization_id text,currency text,status text,archived_at timestamptz,issue_date date,due_date date,total_amount numeric(14,2),paid_amount numeric(14,2),customer_id uuid);create table credit_notes(invoice_id text,organization_id text,credit_date date,amount numeric(14,2));create table invoice_refunds(invoice_id text,organization_id text,refund_date date,amount numeric(14,2));`);
 const financeSource=(await fs.readFile('lib/server/repositories/finance.ts','utf8')).replace("import 'server-only';",'');
 const {financialMetricsData}=await import(moduleUrl(financeSource));
 let differingSessionDays=0;
 for(const zone of ['UTC','Pacific/Kiritimati','Etc/GMT+12']){
  // Pin now() for the complete fixture/assertion transaction, including midnight.
  await financeDb.exec(`begin; set local time zone '${zone}'`);
  try{
 const days=(await financeDb.query("select current_date::text session_day,(now() at time zone 'Europe/Zurich')::date::text business_day")).rows[0];
 if(days.session_day!==days.business_day)differingSessionDays++;
 const today=days.business_day;
 await financeDb.exec(`insert into invoices(id,organization_id,currency,status,archived_at,issue_date,due_date,total_amount,paid_amount) values
 ('partial','a','CHF','partial',null,(now() at time zone 'Europe/Zurich')::date-10,(now() at time zone 'Europe/Zurich')::date-1,100,50),
 ('paid','a','CHF','paid',null,(now() at time zone 'Europe/Zurich')::date-10,(now() at time zone 'Europe/Zurich')::date+10,200,200),
 ('open','a','CHF','sent',null,(now() at time zone 'Europe/Zurich')::date-10,(now() at time zone 'Europe/Zurich')::date+10,300,0),
 ('draft','a','CHF','draft',null,(now() at time zone 'Europe/Zurich')::date,(now() at time zone 'Europe/Zurich')::date+1,1000,0),
 ('cancel','a','CHF','cancelled',null,(now() at time zone 'Europe/Zurich')::date,(now() at time zone 'Europe/Zurich')::date+1,1000,0),
 ('archived','a','CHF','sent',now(),(now() at time zone 'Europe/Zurich')::date,(now() at time zone 'Europe/Zurich')::date+1,1000,0),
 ('foreign-currency','a','EUR','sent',null,(now() at time zone 'Europe/Zurich')::date,(now() at time zone 'Europe/Zurich')::date+1,1000,0),
 ('future','a','CHF','sent',null,(now() at time zone 'Europe/Zurich')::date+10,(now() at time zone 'Europe/Zurich')::date+20,1000,0),
 ('other-tenant','b','CHF','sent',null,(now() at time zone 'Europe/Zurich')::date,(now() at time zone 'Europe/Zurich')::date+1,99999,0);
 insert into credit_notes values('partial','a',(now() at time zone 'Europe/Zurich')::date,20),('partial','a',(now() at time zone 'Europe/Zurich')::date+1,30),('partial','b',(now() at time zone 'Europe/Zurich')::date,500);`);
 const result=await financialMetricsData(financeDb,'a');
 assert.equal(result.snapshot.as_of,today);assert.equal(Number(result.snapshot.paid),250);assert.equal(Number(result.snapshot.open),300);assert.equal(Number(result.snapshot.overdue),30);assert.equal(Number(result.snapshot.credit_balance),0);
 assert.equal(result.revenueEvents.reduce((total,row)=>total+Number(row.amount),0),580,'Issued gross volume minus current credit notes; never payment receipts');
 assert.ok(result.revenueEvents.some(row=>Number(row.amount)===-20),'Credit date remains a real negative revenue event');
 await financeDb.exec("insert into credit_notes values('paid','a',(now() at time zone 'Europe/Zurich')::date,100)");
 const credited=await financialMetricsData(financeDb,'a');assert.equal(Number(credited.snapshot.paid),150);assert.equal(Number(credited.snapshot.credit_balance),100,'Credit after full payment is exposed as credit balance, not a negative receivable');
 assert.equal(Number(credited.snapshot.paid)+Number(credited.snapshot.open)+Number(credited.snapshot.overdue),480,'Ring segments form one adjusted invoice volume');
 await financeDb.exec("insert into invoice_refunds values('paid','a',(now() at time zone 'Europe/Zurich')::date,60),('paid','a',(now() at time zone 'Europe/Zurich')::date+1,30),('paid','b',(now() at time zone 'Europe/Zurich')::date,999)");
 const repaid=await financialMetricsData(financeDb,'a');
 assert.equal(Number(repaid.snapshot.credit_balance),40,'Only actual current-tenant repayments reduce customer credit');
 assert.equal(repaid.snapshot.receivables,credited.snapshot.receivables,'Refunds do not manufacture new receivables');
 assert.deepEqual(repaid.revenueEvents,credited.revenueEvents,'Credit note already corrected revenue; refund must not correct it again');
 assert.deepEqual(cashStatisticEvents({refunds:[{payment_date:today,amount:60}]}),[{date:today,values:{income:-60,costs:0}}],'A refund is a negative receipt on the actual repayment date');
 const empty=await financialMetricsData(financeDb,'empty');assert.equal(empty.revenueEvents.length,0);for(const key of ['paid','open','overdue','credit_balance'])assert.equal(Number(empty.snapshot[key]),0);
 const {listStatusOverride}=await import(moduleUrl(await fs.readFile('lib/list-filter.ts','utf8')));
 assert.equal(listStatusOverride('?status='+encodeURIComponent('Überfällig'),['Alle','Überfällig']),'Überfällig');assert.equal(listStatusOverride('?status=unknown',['Alle']),undefined);assert.equal(listStatusOverride('?status=https://foreign.invalid',['Alle']),undefined);
 console.log('Actual PostgreSQL metric queries: CHF/tenant/date/status/archive scope, credits on their own dates, partial payments, current due balance, credit liability and ring reconciliation passed. Whitelisted list drilldowns passed. Real external runtime-role testing remains separate. Session timezone: '+zone);
  }finally{await financeDb.exec('rollback')}
 }
 assert.ok(differingSessionDays>0,'Exercise a session whose calendar day differs from the Swiss business day');
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

assert.deepEqual(lineNodes.filter(node=>node.type==='span'&&node.props?.['data-value']!==undefined).map(node=>node.props['data-value']),[10,0,-10],'Shared value scale shows the actual signed maximum, midpoint and minimum');

// Long amounts must never be placed into a fixed-size donut hole.
const largeRing=ringExports.RingChart({label:'Outstanding invoice balance with a translated label',parts:[{key:'open',label:'Open',tone:'neutral',value:999999999999.95}]});
assert.equal(nodes(largeRing).some(n=>n.props?.className==='bo-ring-center'),false);
assert.ok(nodes(largeRing).some(n=>n.props?.className==='bo-ring-total'&&JSON.stringify(n.props.children).includes('999999999999.95')),'Complete amount stays in the unconstrained associated total');
assert.equal(nodes(ringExports.RingChart({label:'Invalid',parts:[{key:'bad',label:'Bad',tone:'negative',value:-10}]})).some(n=>n.type==='svg'),false,'Invalid compositions never render a misleading financial ring');
// The actual ring's numeric/percentage labels follow the selected locale;
// monetary rounding and immutable source values are tested independently.
for(const locale of ['de','fr','it','en']){
 activeLocale=locale;
 const input={label:'Counts',format:'number',parts:[{key:'a',label:'A',tone:'positive',value:1234.5},{key:'b',label:'B',tone:'neutral',value:9876.5}]};
 const output=ringExports.RingChart(input),all=nodes(output);
 assert.ok(all.some(node=>node.type==='title'&&node.props.children.includes((1234.5/11111*100).toLocaleString(localeTags[locale],{maximumFractionDigits:1})+' %')),'Percentage locale '+locale);
 assert.ok(JSON.stringify(all.find(node=>node.props?.className==='bo-ring-total').props.children).includes((11111).toLocaleString(localeTags[locale])),'Total locale '+locale);
 assert.equal(input.parts[0].value,1234.5,'Formatting never changes business data');
}
activeLocale='de';const {formatCurrency:actualCurrency}=await import(financialModuleUrl);
for(const language of ['de','fr','it','en'])for(const amount of [-1234.56,0,1234.56]){
 assert.equal(actualCurrency(amount,'CHF',localeTags[language]),'CHF '+amount.toLocaleString(localeTags[language],{minimumFractionDigits:2,maximumFractionDigits:2}).replaceAll('’',"'"));
}
console.log('Selected-language chart totals, percentages and actual signed currency formatting passed in DE/FR/IT/EN; arithmetic/source values unchanged.');
