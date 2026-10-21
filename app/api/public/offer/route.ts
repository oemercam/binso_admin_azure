import {NextRequest} from 'next/server';
import {apiError,ApiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {asObject,enumField,stringField} from '@/lib/server/validation';
import {enforceRateLimit} from '@/lib/server/rate-limit';
import {publicOfferData,requestOfferCode,respondToOffer,withPublicOffer} from '@/lib/server/public-offers';
import {businessDate} from '@/lib/financial-status';
import {createHash} from 'node:crypto';
export const runtime='nodejs';
// The capability travels in a bounded POST body, never in request URLs or logs.
// GET is intentionally absent: scanners cannot confirm, decline or request mail.
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);await enforceRateLimit(request,'public-offer',60,60_000);
 const body=asObject(await readJson(request,8192));
 const token=stringField(body,'token',{min:43,max:43});
 const action=enumField(body,'action',['read','pdf','challenge','respond','view'] as const);
 if(action==='read')return json(await publicOfferData(token));
 if(action==='pdf')return withPublicOffer(token,async(c,{version,link})=>{
  if(createHash('sha256').update(version.pdf).digest('hex')!==version.pdf_sha256)throw new ApiError(409,'pdf_integrity','Die Integrität dieser PDF-Version konnte nicht bestätigt werden.');
  await c.query("insert into offer_public_events(organization_id,link_id,kind,actor,request_key) values($1,$2,'pdf_requested','unverified_client',$3) on conflict(link_id,request_key) do nothing",[link.organization_id,link.id,'pdf:'+businessDate()]);
  return new Response(new Uint8Array(version.pdf),{headers:{'content-type':'application/pdf','cache-control':'private, no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff','content-disposition':'inline; filename="'+version.number.replace(/[^\w.-]/g,'_')+'-v'+version.version+'.pdf"'}});
 });
 if(action==='view'){
  // A client report is not evidence that a human read an offer (MPP/scanners).
  const key='view:'+businessDate();
  await withPublicOffer(token,async(c,{link})=>{await c.query("insert into offer_public_events(organization_id,link_id,kind,actor,request_key) values($1,$2,'view_reported','unverified_client',$3) on conflict(link_id,request_key) do nothing",[link.organization_id,link.id,key]);});
  return json({ok:true});
 }
 const decision=enumField(body,'decision',['accept','decline','question'] as const);
 if(action==='challenge'){
  await enforceRateLimit(request,'public-offer-code',5,15*60_000);
  return json(await requestOfferCode(token,decision));
 }
 const message=stringField(body,'message',{required:decision==='question',min:decision==='question'?1:0,max:4000});
 if(body.confirmed!==true)throw new ApiError(400,'confirmation_required','Bitte ausdrücklich bestätigen.');
 return json(await respondToOffer(token,{action:decision,code:stringField(body,'code',{min:6,max:6}),body:message,requestKey:stringField(body,'requestKey',{min:16,max:80}),confirmed:true}));
}catch(error){return apiError(error);}}
