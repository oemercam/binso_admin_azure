"use client";
import {Statistics,type Series} from './statistics';
import {cashStatisticEvents,financialStatisticEvents,type CashStatisticsData} from '@/lib/cash-statistics';
import {sumMoney} from '@/lib/money';

const cashSeries:Series[]=[{key:'income',label:'Einnahmen',tone:'positive'},{key:'costs',label:'Ausgaben',tone:'negative'}];
export function CashStatistics({data,storageKey}:{data:CashStatisticsData;storageKey:string}){
 const financial=data.financial,snapshot=financial?.snapshot;
 const notice=data.incomplete?'Auszahlungsdaten sind unvollständig. Betriebskosten und Löhne ohne nachgewiesenes Zahlungsdatum sind nicht enthalten. Der Saldo ist kein vollständiger Cashflow oder buchhalterischer Gewinn.':undefined;
 // An older/incomplete response may still show its known cash ledger, but must
 // never fabricate invoice metrics or compose income and outflow into one ring.
 if(!snapshot)return <Statistics title="Finanzentwicklung" subtitle="Erfasste Zahlungseingänge und nachgewiesene Auszahlungen · CHF" storageKey={storageKey} events={cashStatisticEvents(data)} series={cashSeries} metrics={totals=>[{label:'Einnahmen',value:totals.income},{label:'Ausgaben',value:totals.costs},{label:'Ergebnis',value:sumMoney([totals.income,-totals.costs]),hint:'Saldo erfasster Zahlungen'}]} notice={notice}/>;
 const paid=sumMoney([snapshot.paid]),open=sumMoney([snapshot.open]),overdue=sumMoney([snapshot.overdue]),credit=sumMoney([snapshot.credit_balance]);
 const balanceHint='Bestand am '+snapshot.as_of.split('-').reverse().join('.');
 return <Statistics title="Finanzentwicklung" subtitle="Umsatz inkl. MWST nach Belegdatum · Zahlungsstatus zum aktuellen Stichtag · CHF" storageKey={storageKey} events={financialStatisticEvents(data)} series={cashSeries} metricKeys={['revenue']} composition={{label:'Zahlungsstatus',parts:[{key:'paid',label:'Bezahlt',tone:'positive',value:paid},{key:'open',label:'Offen',tone:'neutral',value:open},{key:'overdue',label:'Überfällig',tone:'negative',value:overdue,href:'/rechnungen?status='+encodeURIComponent('Überfällig')}]}} metrics={totals=>[
  {label:'Umsatz',value:totals.revenue,hint:'Belege inkl. MWST nach Gutschriften'},
  {label:'Offene Forderungen',value:sumMoney([open,overdue]),hint:balanceHint},
  {label:'Ausgaben',value:totals.costs,hint:'Nachgewiesene Auszahlungen'},
  {label:'Überfällige Forderungen',value:overdue,hint:balanceHint},
  ...(credit>0?[{label:'Guthaben nach Gutschriften',value:credit,hint:balanceHint}]:[])
 ]} notice={notice}/>;
}
