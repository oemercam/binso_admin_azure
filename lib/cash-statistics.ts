import type {StatisticEvent} from './statistics-period';
export type CashStatisticsData={payments?:Array<{payment_date:string;amount:unknown}>;outflows?:Array<{payment_date:string;amount:unknown}>;incomplete?:boolean};
/** No invoice volume, approved expenses, or gross payroll are cash payments. */
export function cashStatisticEvents(data:CashStatisticsData):StatisticEvent[]{return [...(data.payments??[]).map(row=>({date:row.payment_date,values:{income:row.amount,costs:0}})),...(data.outflows??[]).map(row=>({date:row.payment_date,values:{income:0,costs:row.amount}}))];}
