type Row=Record<string,unknown>;
export type FinancePeriodData={payments?:Row[];expenses?:Row[];payroll?:Row[];operatingCosts?:Row[]};
export type PeriodBounds={start:Date;end:Date};

export function buildFinanceMonths(data:FinancePeriodData,bounds:PeriodBounds,maxMonths=24){
  if(!Number.isFinite(bounds.start.getTime())||!Number.isFinite(bounds.end.getTime())||bounds.end<=bounds.start)return {items:[],truncated:false};
  const last=new Date(bounds.end.getTime()-1);
  const count=(last.getFullYear()-bounds.start.getFullYear())*12+last.getMonth()-bounds.start.getMonth()+1;
  const inMonth=(value:unknown,month:Date)=>{
    const date=new Date(String(value??""));
    return date>=bounds.start&&date<bounds.end&&date.getFullYear()===month.getFullYear()&&date.getMonth()===month.getMonth();
  };
  const sum=(rows:Row[]|undefined,month:Date,dateField:string,amountField:string)=>
    (rows??[]).filter(row=>inMonth(dateField==="period"?String(row.period??"")+"-01":row[dateField],month)).reduce((total,row)=>total+Number(row[amountField]??0),0);
  const items=Array.from({length:Math.min(maxMonths,count)},(_,index)=>{
    const month=new Date(last.getFullYear(),last.getMonth()-index,1);
    const income=sum(data.payments,month,"payment_date","amount");
    const costs=sum(data.expenses,month,"expense_date","amount")+sum(data.operatingCosts,month,"cost_date","amount")+sum(data.payroll,month,"period","gross_amount");
    return {key:String(month.getFullYear())+"-"+String(month.getMonth()+1).padStart(2,"0"),label:month.toLocaleDateString("de-CH",{month:"short",year:"2-digit"}),income,costs,result:income-costs};
  }).reverse();
  return {items,truncated:count>maxMonths};
}

/** Calendar periods in the application's business date; end is exclusive. */
export function financeWindow(range:string,from:string,to:string,today:string):PeriodBounds {
 const now=new Date(today+'T12:00:00');
 if(range==='custom'){const end=new Date(to+'T00:00:00');end.setDate(end.getDate()+1);return {start:new Date(from+'T00:00:00'),end}};
 const end=['last','three','six'].includes(range)?new Date(now.getFullYear(),now.getMonth(),1):range==='year'?new Date(now.getFullYear()+1,0,1):new Date(now.getFullYear(),now.getMonth()+1,1);
 const start=range==='year'?new Date(now.getFullYear(),0,1):new Date(end.getFullYear(),end.getMonth()-({month:1,last:1,three:3,six:6}[range]??3),1);
 return {start,end};
}
