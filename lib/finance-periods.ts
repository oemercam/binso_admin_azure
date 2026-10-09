import {sumMoney} from "./money";
type Row=Record<string,unknown>;
export type FinancePeriodData={payments?:Row[];expenses?:Row[];payroll?:Row[];operatingCosts?:Row[]};
export type PeriodBounds={start:Date;end:Date};

export function buildFinanceMonths(data:FinancePeriodData,bounds:PeriodBounds,maxMonths=24){
  if(!Number.isFinite(bounds.start.getTime())||!Number.isFinite(bounds.end.getTime())||bounds.end<=bounds.start)return {items:[],truncated:false};
  const last=new Date(bounds.end.getTime()-1);
  const count=(last.getFullYear()-bounds.start.getFullYear())*12+last.getMonth()-bounds.start.getMonth()+1;
  const items=Array.from({length:Math.min(maxMonths,count)},(_,index)=>{
    const month=new Date(last.getFullYear(),last.getMonth()-index,1);
    const {income,costs,result}=financeMetrics(data,{start:new Date(Math.max(month.getTime(),bounds.start.getTime())),end:new Date(Math.min(new Date(month.getFullYear(),month.getMonth()+1,1).getTime(),bounds.end.getTime()))});
    return {key:String(month.getFullYear())+"-"+String(month.getMonth()+1).padStart(2,"0"),label:month.toLocaleDateString("de-CH",{month:"short",year:"2-digit"}),income,costs,result};
  }).reverse();
  return {items,truncated:count>maxMonths};
}

/** Calendar periods in the application's business date; end is exclusive. */
export function financeWindow(range:string,from:string,to:string,today:string):PeriodBounds {
 const now=new Date(today+'T12:00:00');
 if(range==='custom'){const end=new Date(to+'T00:00:00');end.setDate(end.getDate()+1);return {start:new Date(from+'T00:00:00'),end}};
 if(range==='previous')return {start:new Date(now.getFullYear()-1,0,1),end:new Date(now.getFullYear(),0,1)};
 if(range==='currentThree'||range==='rollingYear'){const end=new Date(now.getFullYear(),now.getMonth()+1,1);return {start:new Date(end.getFullYear(),end.getMonth()-(range==='rollingYear'?12:3),1),end};}
 const end=['last','three','six'].includes(range)?new Date(now.getFullYear(),now.getMonth(),1):range==='year'?new Date(now.getFullYear()+1,0,1):new Date(now.getFullYear(),now.getMonth()+1,1);
 const start=range==='year'?new Date(now.getFullYear(),0,1):new Date(end.getFullYear(),end.getMonth()-({month:1,last:1,three:3,six:6}[range]??3),1);
 return {start,end};
}

function calendarDate(value:Date){return String(value.getFullYear()).padStart(4,'0')+'-'+String(value.getMonth()+1).padStart(2,'0')+'-'+String(value.getDate()).padStart(2,'0');}
export function inFinancePeriod(value:unknown,bounds:PeriodBounds){const day=String(value??'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(day)&&day>=calendarDate(bounds.start)&&day<calendarDate(bounds.end);}
/** One set of cash metrics for overview, analysis and month charts. */
export function financeMetrics(data:FinancePeriodData,bounds:PeriodBounds){
 const sum=(rows:Row[]|undefined,dateField:string,amountField:string)=>sumMoney((rows??[]).filter(row=>inFinancePeriod(dateField==='period'?String(row.period??'')+'-01':row[dateField],bounds)).map(row=>row[amountField]));
 const income=sum(data.payments,'payment_date','amount'),expense=sum(data.expenses,'expense_date','amount'),operating=sum(data.operatingCosts,'cost_date','amount'),staff=sum(data.payroll,'period','gross_amount');
 const costs=sumMoney([expense,operating,staff]),result=sumMoney([income,-costs]);
 return {income,expense,operating,staff,costs,result};
}

/** Platform subscriptions retain their separate contract-value metric; cash,
 * dates and precision use the same rules as tenant finance. */
export function platformFinanceInsights(data:FinancePeriodData&{subscriptions?:Row[]},range:string,today:string){
 const bounds=financeWindow(range==='three'?'currentThree':range==='year'?'rollingYear':range,'','',today);
 const cash=financeMetrics({payments:data.payments,operatingCosts:data.operatingCosts},bounds);
 const platformRevenue=sumMoney((data.subscriptions??[]).filter(row=>inFinancePeriod(row.created_at,bounds)).map(row=>row.monthly_revenue_chf));
 const monthly=buildFinanceMonths({payments:data.payments},bounds,12).items.map(item=>({label:new Date(item.key+'-01T12:00:00').toLocaleDateString('de-CH',{month:'short'}),value:item.income}));
 return {volume:cash.income,platformRevenue,costs:cash.operating,result:sumMoney([platformRevenue,-cash.operating]),monthly};
}
