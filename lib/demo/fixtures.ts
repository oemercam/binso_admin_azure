import {domainConfig} from "@/config/domain";

export const demoRecordFixtures=[
 {module:"kunden",status:"Aktiv",row:["Alpina Architektur AG","Zürich","kontakt@alpina-demo.ch","Aktiv"],fields:{name:"Alpina Architektur AG",city:"Zürich",email:"kontakt@alpina-demo.ch"}},
 {module:"offerten",status:"Offen",row:["OF-DEMO-1042","Alpina Architektur AG","CHF 12’480","Offen"],fields:{number:"OF-DEMO-1042",customer:"Alpina Architektur AG",amount:"12480"}},
 {module:"auftraege",status:"In Bearbeitung",row:["AU-DEMO-0871","Bergwerk Digital AG","CHF 28’900","In Bearbeitung"],fields:{number:"AU-DEMO-0871",customer:"Bergwerk Digital AG",amount:"28900"}},
 {module:"rechnungen",status:"Offen",row:["RE-DEMO-0318","Alpina Architektur AG","CHF 7’820","Offen"],fields:{number:"RE-DEMO-0318",customer:"Alpina Architektur AG",amount:"7820"}},
 {module:"projekte",status:"Aktiv",row:["Website Relaunch","Bergwerk Digital AG","42 h","Aktiv"],fields:{name:"Website Relaunch",customer:"Bergwerk Digital AG",hours:"42"}}
] as const;

export const demoAnalyticsFixture={
 report:{revenue:128450,costs:79640,openReceivables:24300,trackedHours:612},
 vat:{outputVat:18940,inputVat:11120},
 defaultVatRate:domainConfig.defaultVatRate,
 defaultHourlyRate:180,
} as const;


export const demoBankImportFixtures=[
 {status:"Zugeordnet",payer:"Müller Bau AG",reference:"CAMT-DEMO-001",amount:4850,invoice:"R-DEMO-0184"},
 {status:"Offen",payer:"Unbekannt",reference:"CAMT-DEMO-002",amount:360,invoice:""}
] as const;

export const demoPayrollFixture=[
 {name:"Marc Beispiel",brutto:12500,allowance:0,ahv:662.5,alv:137.5,nbu:156.25,bvg:300,withholding:0,netto:11243.75},
 {name:"Anna Muster",brutto:8400,allowance:300,ahv:461.1,alv:95.7,nbu:108.75,bvg:300,withholding:0,netto:7734.45},
 {name:"Luca Meier",brutto:5800,allowance:0,ahv:307.4,alv:63.8,nbu:72.5,bvg:250,withholding:0,netto:5106.3},
] as const;
