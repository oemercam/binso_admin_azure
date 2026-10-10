"use client";
import {Statistics} from './statistics';
import {cashStatisticEvents,type CashStatisticsData} from '@/lib/cash-statistics';
import {sumMoney} from '@/lib/money';
export function CashStatistics({data,storageKey}:{data:CashStatisticsData;storageKey:string}){return <Statistics title="Finanzentwicklung" subtitle="Erfasste Zahlungseingänge und nachgewiesene Auszahlungen · CHF" storageKey={storageKey} events={cashStatisticEvents(data)} series={[{key:'income',label:'Einnahmen',tone:'positive'},{key:'costs',label:'Ausgaben',tone:'negative'}]} metrics={totals=>[{label:'Einnahmen',value:totals.income},{label:'Ausgaben',value:totals.costs},{label:'Ergebnis',value:sumMoney([totals.income,-totals.costs]),hint:'Saldo erfasster Zahlungen'}]} notice={data.incomplete?'Auszahlungsdaten sind unvollständig. Betriebskosten und Löhne ohne nachgewiesenes Zahlungsdatum sind nicht enthalten. Der Saldo ist kein vollständiger Cashflow oder buchhalterischer Gewinn.':undefined}/>;}
