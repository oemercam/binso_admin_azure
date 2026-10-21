import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {moduleUrl} from './data-test-modules.mjs';
const compile=async(file,replacements)=>{let source=(await fs.readFile(file,'utf8')).replace("import 'server-only';",'').replace('import "server-only";','');for(const [key,value] of Object.entries(replacements))source=source.replaceAll(JSON.stringify(key),JSON.stringify(value)).replaceAll("'"+key+"'",JSON.stringify(value));return moduleUrl(source)};
const rendererUrl=await compile('lib/server/mail-message.ts',{'nodemailer/lib/mail-composer':import.meta.resolve('nodemailer/lib/mail-composer/index.js')});
const {renderMailMessage}=await import(rendererUrl);
const message={to:'recipient@fixture.invalid',subject:'Binso One – Prüfung',text:'Technischer Empfangstest, keine Aktion erforderlich.',html:'<html><body><p>Technischer Empfangstest.</p></body></html>',attachments:[{name:'Prüfung.pdf',contentType:'application/pdf',content:Buffer.from('%PDF-synthetic\n\u0000\u0001\u00ff')}]};
function parts(bytes){return bytes.toString('utf8').split(/\r\n--[^\r\n]+/g).flatMap(segment=>{
 const type=segment.match(/(?:^|\r\n)Content-Type:\s*([^\r\n]+)/)?.[1],end=segment.indexOf('\r\n\r\n');
 const encoding=segment.slice(0,end).match(/Content-Transfer-Encoding:\s*([^\r\n]+)/)?.[1];
 if(!type||end<0||!encoding)return [];
 const content=segment.slice(end+4).replace(/\r\n$/,'');
 const body=encoding==='base64'?Buffer.from(content.replace(/\s/g,''),'base64'):encoding==='quoted-printable'?Buffer.from(content.replace(/=\r\n/g,'').replace(/=([0-9A-F]{2})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16))),'latin1'):Buffer.from(content);
 return [{type,body}];
})}
const rendered=await renderMailMessage(message,'sender@fixture.invalid'),decoded=parts(rendered);
const branded=await renderMailMessage({...message,senderName:'Synthetic Tenant',replyTo:'verified@fixture.invalid'},'sender@fixture.invalid');assert.ok(branded.toString().includes('verified@fixture.invalid'));
await assert.rejects(()=>renderMailMessage({...message,replyTo:'a@fixture.invalid,b@fixture.invalid'},'sender@fixture.invalid'));
await assert.rejects(()=>renderMailMessage({...message,senderName:'Injected\r\nBcc: x@fixture.invalid'},'sender@fixture.invalid'));
assert.equal(decoded.find(p=>p.type.startsWith('text/plain')).body.toString(),message.text);
assert.equal(decoded.find(p=>p.type.startsWith('text/html')).body.toString(),message.html);
assert.deepEqual(decoded.find(p=>p.type.startsWith('application/pdf')).body,message.attachments[0].content);
assert.ok(rendered.toString().includes('multipart/alternative'));assert.ok(rendered.toString().includes('multipart/mixed'));
for(const to of ['victim@fixture.invalid,other@fixture.invalid','victim@fixture.invalid\r\nBcc: other@fixture.invalid','Name <victim@fixture.invalid>'])await assert.rejects(()=>renderMailMessage({...message,to},'sender@fixture.invalid'),/Invalid mail envelope/);
await assert.rejects(()=>renderMailMessage({...message,subject:'Injected\r\nBcc:other@fixture.invalid'},'sender@fixture.invalid'),/Invalid mail envelope/);
await assert.rejects(()=>renderMailMessage(message,'not-an-email-guid'),/Invalid mail envelope/);
await assert.rejects(()=>renderMailMessage({...message,text:''},'sender@fixture.invalid'),/Plain text and HTML/);
globalThis.__mailMessageTest={env:{appMode:'production',graphTenantId:'synthetic-tenant',graphClientId:'synthetic-client',graphClientSecret:'synthetic-secret',graphSenderUserId:'sender@fixture.invalid'},logs:[]};
const env=moduleUrl('export const env=globalThis.__mailMessageTest.env;'),logger=moduleUrl('export const log=(...args)=>globalThis.__mailMessageTest.logs.push(args);');
const email=await import(await compile('lib/server/email.ts',{'./mail-message':rendererUrl,'@/lib/server/env':env,'@/lib/server/logger':logger}));
let providerStatus=202;const requests=[],originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
 requests.push({url,options});
 if(url.startsWith('https://login.microsoftonline.com/'))return Response.json({access_token:'synthetic-token-not-a-real-secret',expires_in:3600});
 assert.equal(url,'https://graph.microsoft.com/v1.0/users/sender%40fixture.invalid/sendMail');assert.equal(options.method,'POST');assert.equal(options.headers['content-type'],'text/plain');assert.equal(options.cache,'no-store');
 const payload=parts(Buffer.from(options.body,'base64'));assert.equal(payload.find(p=>p.type.startsWith('text/plain')).body.toString(),message.text);assert.deepEqual(payload.find(p=>p.type.startsWith('application/pdf')).body,message.attachments[0].content);
 return new Response(null,{status:providerStatus});
};
try{
 assert.equal((await email.sendMail(message)).delivered,true);assert.equal(requests.length,2,'Exactly one Graph request and its existing token request');
 providerStatus=503;await assert.rejects(()=>email.sendMail(message),/Microsoft Graph/);assert.equal(requests.length,3,'No automatic retry or second provider');
 providerStatus=200;await assert.rejects(()=>email.sendMail(message),/Microsoft Graph/,'Unexpected success code is not a confirmed Graph acceptance');
 const before=requests.length;await assert.rejects(()=>email.sendMail({...message,to:'bad,recipient@fixture.invalid'}));assert.equal(requests.length,before,'Invalid envelope fails before external authentication or send');
 globalThis.__mailMessageTest.env.graphClientSecret='';await assert.rejects(()=>email.sendMail(message),/nicht vollständig/);assert.equal(requests.length,before);
 for(const locale of ['de','en','fr','it','tr']){
  const html=email.mailLayout('Title <unsafe>','<p>Safe formatted body</p>',{label:'Action <unsafe>',url:'https://fixture.invalid/path?a=1&b=2'},locale);
  assert.ok(html.includes(`lang="${locale}"`));assert.ok(html.includes('color-scheme'));assert.ok(html.includes('prefers-color-scheme:dark'));assert.ok(html.includes('role="presentation"'));assert.ok(html.includes('Title &lt;unsafe&gt;'));assert.ok(!html.includes('href="javascript:'));
 }
 assert.throws(()=>email.mailLayout('Title','<p>Body</p>',{label:'Unsafe',url:'javascript:alert(1)'}),/Invalid mail action URL/);
 for(const entry of globalThis.__mailMessageTest.logs){assert.ok(!JSON.stringify(entry).includes(message.to));assert.ok(!JSON.stringify(entry).includes('synthetic-secret'));}
 console.log('Graph MIME: actual plain/HTML/PDF roundtrip, single-envelope/header guards, no file/URL transport, exact Graph 202, no retry/fallback, missing-config failure, localized Light/Dark template and safe logs passed. Real client rendering/delivery remains open.');
}finally{globalThis.fetch=originalFetch;delete globalThis.__mailMessageTest}
