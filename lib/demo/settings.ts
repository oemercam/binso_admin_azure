import {domainConfig} from "@/config/domain";
import type {AppPreferences,DemoSettings} from "@/lib/local-store";

export const demoDefaultSettings:DemoSettings={
  companyName:"Binso GmbH",uid:"CHE-173.401.068 MWST",address:"Weissbadstrasse 8b",zipCity:"9050 Appenzell",
  email:"kontakt@binso.ch",phone:"+41 58 510 88 58",iban:"CH93 0076 2011 6238 5295 7",
  defaultVat:String(domainConfig.defaultVatRate),paymentDays:String(domainConfig.defaultPaymentDays),currency:domainConfig.currency,language:domainConfig.defaultLocaleTag,vatMethod:"Effektive Abrechnung",
  invoiceIntro:"Besten Dank für Ihren Auftrag. Wir erlauben uns, folgende Leistungen in Rechnung zu stellen.",
  quoteIntro:"Besten Dank für Ihre Anfrage. Gerne offerieren wir Ihnen folgende Leistungen.",
  reminderDays:String(domainConfig.defaultReminderDays),notificationsEmail:true,notificationsPush:true,
  users:[
    {id:"u1",name:"Demo Inhaber",email:"demo@binso.local",role:"Inhaber",active:true,language:"de"},
    {id:"u2",name:"Anna Muster",email:"anna@binso.ch",role:"Finanzen",active:true,language:"de"},
    {id:"u3",name:"Luca Meier",email:"luca@binso.ch",role:"Mitarbeiter",active:true,language:"de"},
  ],
  sequences:{kunden:"K-{YYYY}-{####}",offerten:"O-{YYYY}-{####}",auftraege:"A-{YYYY}-{####}",rechnungen:"R-{YYYY}-{####}",projekte:"P-{YYYY}-{####}"},
  integrations:{bank:false,email:false,estv:false,storage:true},
};

export const demoDefaultAppPreferences:AppPreferences={activeCompany:"Binso GmbH",compact:false,activeUserId:"u1"};
