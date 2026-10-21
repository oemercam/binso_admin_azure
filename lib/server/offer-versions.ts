import 'server-only';
import {createHash} from 'node:crypto';
import type {PoolClient} from 'pg';
import type {SessionUser} from './session';
import {listApiBusiness} from './repositories/business-api';
import {documentPdf} from './document-pdf';
import {documentLogo} from './document-logo';
import {ApiError} from './http';

/** Caller holds the quote lock. Render once from its frozen commercial snapshot. */
export async function sealOfferVersion(c:PoolClient,s:SessionUser,row:Record<string,unknown>){
 const existing=(await c.query('select * from offer_versions where organization_id=$1 and quote_id=$2 and version=$3',[s.organizationId,row.id,row.offer_version])).rows[0];
 if(existing)return existing;
 if(row.status==='draft')throw new ApiError(409,'draft_not_issued','Entwürfe sind keine freigegebenen Angebotsversionen.');
 const current=(await listApiBusiness(c,s,'documents','id=eq.'+row.id+'&kind=eq.offer'))[0];
 if(!current)throw new ApiError(404,'not_found','Angebot nicht gefunden.');
 const document:Record<string,unknown>={...current,published_version:Number(row.offer_version)};
 const company=(await c.query('select * from organizations where id=$1',[s.organizationId])).rows[0];
 const logo=await documentLogo(c,s.organizationId,document,company);
 const pdf=await documentPdf(document,company,logo);
 // Keep only issuer fields actually needed by the public document, never tenant configuration.
 const frozen=document.issuer_snapshot&&typeof document.issuer_snapshot==='object'&&Object.keys(document.issuer_snapshot).length?document.issuer_snapshot as Record<string,unknown>:company;
 const issuer={...Object.fromEntries(['name','legal_name','address','zip','city','country','email','phone','website','vat_number'].map(key=>[key,frozen[key]??''])),...(logo?{logo_data:'data:image/png;base64,'+logo.toString('base64')}:{})};
 return (await c.query('insert into offer_versions(organization_id,quote_id,version,number,document,company,pdf,pdf_sha256,created_by_user_id) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *',[s.organizationId,row.id,row.offer_version,row.quote_no,JSON.stringify(document),JSON.stringify(issuer),pdf,createHash('sha256').update(pdf).digest('hex'),s.userId])).rows[0];
}

/** Called under the invoice lock, inside the issue transaction. Never on legacy reads. */
export async function sealInvoiceVersion(c:PoolClient,s:SessionUser,row:Record<string,unknown>){
 const existing=(await c.query('select * from invoice_versions where organization_id=$1 and invoice_id=$2',[s.organizationId,row.id])).rows[0];if(existing)return existing;
 if(row.status==='draft')throw new ApiError(409,'draft_not_issued','Entwürfe sind keine ausgestellten Rechnungen.');
 const document=(await listApiBusiness(c,s,'documents','id=eq.'+row.id+'&kind=eq.invoice'))[0];
 if(!document)throw new ApiError(404,'not_found','Rechnung nicht gefunden.');
 const company=(await c.query('select * from organizations where id=$1',[s.organizationId])).rows[0];
 const pdf=await documentPdf(document,company,await documentLogo(c,s.organizationId,document,company));
 return (await c.query('insert into invoice_versions(organization_id,invoice_id,pdf,pdf_sha256,created_by_user_id) values($1,$2,$3,$4,$5) returning *',[s.organizationId,row.id,pdf,createHash('sha256').update(pdf).digest('hex'),s.userId])).rows[0];
}
