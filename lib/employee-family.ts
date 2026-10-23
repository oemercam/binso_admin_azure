import {businessDate} from '@/lib/financial-status';
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const date=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const text=(v:unknown,max:number)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!/[\u0000-\u001f\u007f]/.test(v);
export type ChildInput={displayName:string;birthDate:string;active:boolean;expectedRevision?:number};
export type AllowanceInput={childRevisionId:string;employmentRevisionId:string;allowanceType:'child'|'education';startsOn:string;endsOn:string;authority:string;canton:string;decisionReference:string;monthlyAmount:string;currency:'CHF';status:'draft'|'verified'|'rejected'|'revoked';expectedRevision?:number};
export function childInputIssue(input:unknown):string|null{
 if(!input||typeof input!=='object'||Array.isArray(input))return 'Die Familienangaben sind ungültig.';
 const b=input as Record<string,unknown>;
 if(Object.keys(b).some(k=>!['displayName','birthDate','active','expectedRevision'].includes(k))||!text(b.displayName,160)||!date(b.birthDate)||String(b.birthDate)>businessDate()||typeof b.active!=='boolean'||(b.expectedRevision!==undefined&&(!Number.isSafeInteger(b.expectedRevision)||Number(b.expectedRevision)<1)))return 'Bitte Namen, gültiges Geburtsdatum und aktuellen Revisionsstand prüfen.';
 return null;
}
export function allowanceInputIssue(input:unknown):string|null{
 if(!input||typeof input!=='object'||Array.isArray(input))return 'Die Anspruchsangaben sind ungültig.';
 const b=input as Record<string,unknown>;
 if(Object.keys(b).some(k=>!['childRevisionId','employmentRevisionId','allowanceType','startsOn','endsOn','authority','canton','decisionReference','monthlyAmount','currency','status','expectedRevision'].includes(k))||!uuid(b.childRevisionId)||!uuid(b.employmentRevisionId)||!['child','education'].includes(String(b.allowanceType))||!['draft','verified','rejected','revoked'].includes(String(b.status))||!date(b.startsOn)||!date(b.endsOn)||String(b.endsOn)<String(b.startsOn)||!text(b.authority,180)||!text(b.decisionReference,180)||!['AG','AI','AR','BE','BL','BS','FR','GE','GL','GR','JU','LU','NE','NW','OW','SG','SH','SO','SZ','TG','TI','UR','VD','VS','ZG','ZH'].includes(String(b.canton))||b.currency!=='CHF'||typeof b.monthlyAmount!=='string'||!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(b.monthlyAmount)||!/[1-9]/.test(b.monthlyAmount)||(b.expectedRevision!==undefined&&(!Number.isSafeInteger(b.expectedRevision)||Number(b.expectedRevision)<1)))return 'Bitte Kind, Anstellung, Kassenentscheid, Kanton, Zeitraum und bestätigten CHF-Betrag vollständig prüfen.';
 return null;
}
