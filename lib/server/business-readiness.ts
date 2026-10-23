import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from './session';
import {ApiError} from './http';
import {authorize} from './rbac';
import {audit} from './audit';
import {organizationPlanInTransaction} from './plan-access';
import {planAllowsModule} from '@/config/plan-access';
import {tenantCan} from '@/lib/permissions';
import {canonicalPlanId,effectiveUserLimit,capacityReached} from '@/config/plans';
import {invoicePaymentRequirements,createQrBillData} from '@/lib/qr-bill';
import {setupDestination,type SetupGuide,type SetupTask,type InvoiceReadiness,type SetupField} from '@/lib/action-readiness';

export function canConfigureSetup(s:SessionUser){return tenantCan(s.role,'organization:write',s.moduleProfile);}
async function company(c:PoolClient,s:SessionUser){
 const row=(await c.query('select name,legal_name,street,building_number,postal_code,city,country_code,iban,qr_iban,payment_terms_days,logo_url,invoice_intro_text,quote_intro_text from organizations where id=$1',[s.organizationId])).rows[0];
 if(!row)throw new ApiError(404,'organization_not_found','Unternehmen wurde nicht gefunden.');
 return row;
}
/** Only configuration owners see the optional company setup guide. */
export async function readSetupGuide(c:PoolClient,s:SessionUser):Promise<SetupGuide>{
 authorize(s,'organization:read');
 if(!canConfigureSetup(s))throw new ApiError(403,'forbidden','Keine Berechtigung.');
 const item=await company(c,s),issues=invoicePaymentRequirements(item);
 const pref=(await c.query('select dismissed from user_setup_preferences where organization_id=$1 and user_id=$2',[s.organizationId,s.userId])).rows[0];
 const tasks:SetupTask[]=[
  {id:'name',title:'Firmenname',importance:'required',complete:!issues.some(i=>['name','legalName'].includes(i.field)),href:setupDestination(item.legal_name?'legalName':'name')},
  {id:'address',title:'Firmenadresse',importance:'required',complete:!issues.some(i=>['street','postalCode','city','countryCode'].includes(i.field)),href:setupDestination('street')},
  {id:'bank',title:'Bankverbindung',importance:'required',complete:!issues.some(i=>['iban','qrIban'].includes(i.field)),href:setupDestination(item.qr_iban?'qrIban':'iban')},
  {id:'terms',title:'Zahlungsfrist',importance:'recommended',complete:Number.isInteger(Number(item.payment_terms_days))&&item.payment_terms_days!==null&&Number(item.payment_terms_days)>=0&&Number(item.payment_terms_days)<=365,href:setupDestination('paymentTerms')},
  {id:'numbering',title:'Automatische Nummerierung',importance:'optional',complete:true,href:'/einstellungen/dokumente'},
  {id:'texts',title:'Dokumenttexte',importance:'optional',complete:!!(item.invoice_intro_text||item.quote_intro_text),href:setupDestination('documentTexts')},
  {id:'logo',title:'Firmenlogo',importance:'optional',complete:!!item.logo_url,href:setupDestination('logo')},
 ];
 const capacity=(await c.query("select e.max_users,s.plan,(select count(*) from organization_memberships m where m.organization_id=e.organization_id and m.status='active') active,(select count(*) from organization_invitations i where i.organization_id=e.organization_id and i.status='pending' and i.expires_at>now()) pending from organization_entitlements e join organization_subscriptions s on s.organization_id=e.organization_id where e.organization_id=$1",[s.organizationId])).rows[0];
 const plan=canonicalPlanId(capacity?.plan);
 if(plan&&tenantCan(s.role,'users:manage',s.moduleProfile)&&!capacityReached(Number(capacity.active)+Number(capacity.pending),effectiveUserLimit(plan,capacity.max_users)))tasks.push({id:'team',title:'Mitarbeiter einladen',importance:'optional',complete:Number(capacity.active)+Number(capacity.pending)>1,href:'/einstellungen/team'});
 const required=tasks.filter(task=>task.importance==='required');
 return {dismissed:pref?.dismissed===true,editable:s.organizationStatus!=='read_only'&&!s.isDemo,requiredComplete:required.filter(task=>task.complete).length,requiredTotal:required.length,tasks};
}
export async function setSetupGuideDismissed(c:PoolClient,s:SessionUser,dismissed:unknown){
 authorize(s,'organization:write');
 if(!canConfigureSetup(s)||s.isDemo)throw new ApiError(403,'forbidden','Keine Berechtigung.');
 if(typeof dismissed!=='boolean')throw new ApiError(400,'preference_invalid','Bitte eine gültige Einstellung wählen.');
 const changed=await c.query('insert into user_setup_preferences(organization_id,user_id,dismissed) values($1,$2,$3) on conflict(organization_id,user_id) do update set dismissed=excluded.dismissed,updated_at=now() where user_setup_preferences.dismissed is distinct from excluded.dismissed returning user_id',[s.organizationId,s.userId,dismissed]);
 if(changed.rowCount)await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'setup_guide.preference_changed',entityType:'user_setup_preference',entityId:s.userId,metadata:{dismissed}});
 return {dismissed};
}
/** Advisory GET only. The existing issue transaction revalidates the same QR
 * validator under its document lock; this preflight never issues or sends. */
export async function readInvoiceReadiness(c:PoolClient,s:SessionUser,number:string):Promise<InvoiceReadiness>{
 authorize(s,'invoices:write');if(!planAllowsModule(await organizationPlanInTransaction(c,s.organizationId),'rechnungen'))throw new ApiError(403,'module_unavailable','Diese Funktion ist in deinem aktuellen Plan nicht enthalten.');
 if(!number||number.length>80)throw new ApiError(400,'number_invalid','Bitte eine gültige Dokumentnummer wählen.');
 const row=(await c.query("select invoice_no,customer_id,qr_reference,total_amount,currency,status from invoices where organization_id=$1 and invoice_no=$2 and archived_at is null",[s.organizationId,number])).rows[0];
 if(!row)throw new ApiError(404,'not_found','Dokument wurde nicht gefunden.');
 const returnTo='/rechnungen/'+encodeURIComponent(number);
 if(row.status!=='draft')return {ready:false,number,message:'Der Dokumentstatus hat sich geändert. Bitte den gespeicherten Stand prüfen.',recovery:{href:returnTo,label:'Aktualisieren'}};
 const item=await company(c,s),issue=invoicePaymentRequirements(item)[0];
 if(issue)return {ready:false,number,message:issue.message,recovery:canConfigureSetup(s)?{href:setupDestination(issue.field as SetupField,returnTo),label:'Angaben ergänzen'}:undefined};
 const debtor=(await c.query('select name,address as street,zip as postal_code,city,country from customers where organization_id=$1 and id=$2',[s.organizationId,row.customer_id])).rows[0];
 try{createQrBillData(item,{number,reference:row.qr_reference,total:Number(row.total_amount),currency:row.currency,debtor});}
 catch(error){return {ready:false,number,message:error instanceof Error?error.message:'Bitte Zahlungsdaten prüfen.',recovery:{href:returnTo,label:'Rechnung prüfen'}};}
 return {ready:true,number};
}
