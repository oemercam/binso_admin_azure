import {addDays,domainConfig} from '@/config/domain';
import {businessDate,financialStatus,openAmount,type FinancialDocument} from './financial-status';
export type ReminderHistory={stage:number;status:string;completed_at?:string|null;deadline?:string|null};
/** Manual escalation only; no fees, interest, collection action or scheduled mail. */
export function planPaymentReminder(document:FinancialDocument,history:ReminderHistory[],today=businessDate()):{error:'reminder_not_due'|'reminder_complete'|'reminder_too_soon'|'reminder_history_invalid'}|{stage:number;amount:number;deadline:string}{
 if(document.kind!=='invoice'||financialStatus(document,today)!=='overdue')return {error:'reminder_not_due' as const};
 const sent=history.filter(item=>item.status==='sent');
 if(sent.some(item=>!Number.isInteger(Number(item.stage))||Number(item.stage)<1||Number(item.stage)>domainConfig.reminderStages.length||!/^\d{4}-\d{2}-\d{2}$/.test(String(item.deadline??''))))return {error:'reminder_history_invalid' as const};
 const stage=Math.max(0,...sent.map(item=>Number(item.stage)))+1;
 if(stage>domainConfig.reminderStages.length)return {error:'reminder_complete' as const};
 const latest=sent.map(item=>String(item.deadline)).sort().at(-1);
 if(latest&&today<=latest)return {error:'reminder_too_soon' as const};
 return {stage,amount:openAmount(document),deadline:addDays(new Date(today+'T12:00:00Z'),domainConfig.defaultReminderDays).toISOString().slice(0,10)};
}
