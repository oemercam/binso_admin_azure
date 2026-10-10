import "server-only";
import type {PoolClient} from "pg";
import sharp from "sharp";
import {getBlobByUrl} from "./storage";
import {documentPresentationData} from "./document-pdf";
/** No arbitrary URL fetch: only the tenant's existing company_logo file ID. */
export async function documentLogo(c:PoolClient,organizationId:string,document:Record<string,unknown>,company:Record<string,unknown>){
 const {company:issuer}=documentPresentationData(document,company);
 const match=String(issuer.logo_url||'').match(/^\/api\/files\/([0-9a-f-]{36})\/download$/i);
 if(!match)return undefined;
 const row=(await c.query("select f.content_type,f.blob_url,b.body from file_objects f left join file_contents b on b.file_id=f.id and b.organization_id=f.organization_id where f.organization_id=$1 and f.id=$2 and f.purpose='company_logo' and f.scan_status='clean' and f.size_bytes<=10485760",[organizationId,match[1]])).rows[0];
 if(!row||!['image/png','image/jpeg','image/webp'].includes(row.content_type))return undefined;
 const bytes=row.body?Buffer.from(row.body):row.blob_url?Buffer.from((await getBlobByUrl(row.blob_url)).body):null;
 if(!bytes)return undefined;
 return sharp(bytes,{limitInputPixels:16000000}).resize({width:900,height:500,fit:'inside',withoutEnlargement:true}).png().toBuffer();
}
