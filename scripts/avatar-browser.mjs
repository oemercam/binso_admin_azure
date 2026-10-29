import {openSettingsEditor} from './shared-control-browser.mjs';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createHash} from 'node:crypto';

/** Actual profile components with isolated API fixtures; native HTTP/RLS is separate. */
export async function verifyAvatarBrowser({page,context,base,capture,navigate}){
 const bytes=await sharp({create:{width:1200,height:600,channels:3,background:'#234567'}}).png().toBuffer();
 const file={name:'synthetic-avatar.png',mimeType:'image/png',buffer:bytes};
 const expectedHash=createHash('sha256').update(bytes).digest('hex');
 // Observe the real FormData without replacing its body or response. WebKit's
 // request protocol can omit binary multipart bytes; this also checks their hash.
 await context.addInitScript(()=>{
  const original=window.fetch;window.__avatarUploadEvidence=[];
  window.fetch=async(input,init)=>{
   if(new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href).pathname==='/api/files'&&init?.body instanceof FormData){
    const body=init.body,file=body.get('file');
    if(file instanceof File){const hash=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());window.__avatarUploadEvidence.push({size:file.size,type:file.type,purpose:body.get('purpose'),crop:body.get('avatarCrop'),sha256:Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('')});}
   }
   return original.call(window,input,init);
  };
 });
 const old='/api/files/00000000-0000-4000-8000-000000000091/download',id='00000000-0000-4000-8000-000000000092',next='/api/files/'+id+'/download';
 let avatar=old,uploads=0,removals=0,failUpload=false,failRemove=false,verdict='clean';const keys=[],crops=[];
 const profile=route=>route.fulfill({json:{item:{id:'avatar-fixture',display_name:'Synthetic Avatar User',first_name:'Synthetic',last_name:'Avatar User',avatar_url:avatar,theme:'light',language:'de'},email:'avatar@fixture.invalid'}});
 const image=route=>route.fulfill({contentType:'image/png',body:bytes});
 const upload=async route=>{
  uploads++;keys.push(route.request().headers()['idempotency-key']);
  const evidence=await page.evaluate(()=>window.__avatarUploadEvidence.at(-1));
  assert.equal(evidence.purpose,'profile_avatar');assert.equal(evidence.size,bytes.length,'Original file goes through the central server decoder');assert.equal(evidence.sha256,expectedHash,'Actual browser FormData preserves every original byte');assert.equal(evidence.type,'image/png');crops.push(JSON.parse(evidence.crop));
  if(failUpload)return route.fulfill({status:503,json:{message:'Synthetic avatar upload unavailable'}});
  if(verdict==='clean')avatar=next;
  return route.fulfill({status:201,json:{item:{id,scanStatus:verdict,available:verdict==='clean'}}});
 };
 const mutate=async route=>{
  if(route.request().method()==='PATCH'){
   assert.deepEqual(route.request().postDataJSON(),{action:'activate_profile_avatar',expectedAvatarUrl:old});
   if(verdict!=='clean')return route.fulfill({status:409,json:{message:'Das Profilbild ist noch nicht sicher freigegeben.'}});
   avatar=next;return route.fulfill({json:{activated:true,item:{id}}});
  }
  assert.equal(route.request().method(),'DELETE');removals++;
  if(failRemove)return route.fulfill({status:503,json:{message:'Synthetic avatar removal unavailable'}});
  avatar='';return route.fulfill({json:{removed:true}});
 };
 const registrations=[['**/api/settings/profile',profile],['**/api/files/*/download',image],['**/api/files',upload],['**/api/files/'+id,mutate]];
 for(const [pattern,handler] of registrations)await context.route(pattern,handler);
 const open=async()=>{await openSettingsEditor(page);const editor=page.getByRole('region',{name:'Persönliche Daten bearbeiten',exact:true});await editor.waitFor();return editor;};
 const select=async(camera=false)=>{await page.locator(camera?'#profile-avatar-upload-camera':'#profile-avatar-upload').setInputFiles(file);const preview=page.getByRole('dialog',{name:'Profilbild prüfen',exact:true});await preview.waitFor();await page.waitForFunction(()=>{const sliders=[...document.querySelectorAll('.avatar-crop-controls input[type="range"]')];return document.querySelector('.avatar-crop-preview img')?.naturalWidth>0&&sliders.length===3&&sliders.every(slider=>!slider.disabled);});return preview;};
 const confirm=preview=>preview.getByRole('button',{name:'Bild übernehmen',exact:true});
 const current=expected=>page.waitForFunction(value=>document.querySelector('.settings-profile .person-avatar img')?.getAttribute('src')===value,expected);
 const reload=async()=>{await page.waitForLoadState('networkidle');await page.reload();await page.waitForLoadState('networkidle');};
 try{
  for(const width of [390,820,1440]){
   avatar=old;verdict='clean';await page.setViewportSize({width,height:900});page=await navigate(base+'/einstellungen/konto');await current(old);
   const profileSize=await page.locator('.settings-profile .person-avatar').evaluate(el=>el.getBoundingClientRect().width);assert.ok(profileSize>=52&&profileSize<=64,'V5 compact profile identity must remain within the approved 52–64px range: '+profileSize);
   const editor=await open();assert.equal(await editor.locator('#profile-avatar-upload-camera').getAttribute('capture'),'user');
   if(width===390){const count=uploads;await editor.locator('#profile-avatar-upload').setInputFiles({name:'unsupported.heic',mimeType:'image/heic',buffer:Buffer.from('unsupported fixture')});await editor.getByRole('alert').filter({hasText:'Bitte einen unterstützten Dateityp auswählen.'}).waitFor();assert.equal(uploads,count);assert.equal(avatar,old);}
   const before=uploads;let preview=await select(true);assert.equal(uploads,before,'Camera/file selection cannot upload');
   await preview.getByRole('slider',{name:'Vergrösserung',exact:true}).press('End');await preview.getByRole('slider',{name:'Horizontaler Ausschnitt',exact:true}).press('Home');await preview.getByRole('slider',{name:'Vertikaler Ausschnitt',exact:true}).press('End');
   assert.equal(await preview.getByRole('slider',{name:'Vergrösserung',exact:true}).inputValue(),'3');assert.equal(uploads,before);
   if(width===390)await page.setViewportSize({width,height:400});
   const footer=preview.locator(':scope>.filter-sheet-actions');await footer.scrollIntoViewIfNeeded();const box=await footer.boundingBox();assert.ok(box.y>=0&&box.y+box.height<=page.viewportSize().height+1,'Footer remains reachable in a short viewport');await capture(width+'-crop');
   await preview.getByRole('button',{name:'Abbrechen',exact:true}).click();const discard=page.getByRole('alertdialog',{name:'Änderungen verwerfen?',exact:true});await discard.waitFor();assert.equal(uploads,before,'Discard confirmation cannot upload');await discard.getByRole('button',{name:'Verwerfen',exact:true}).click();await preview.waitFor({state:'hidden'});assert.equal(uploads,before);assert.equal(avatar,old);
   await page.setViewportSize({width,height:900});preview=await select();await preview.getByRole('slider',{name:'Vergrösserung',exact:true}).press('End');await preview.getByRole('slider',{name:'Horizontaler Ausschnitt',exact:true}).press('Home');await preview.getByRole('slider',{name:'Vertikaler Ausschnitt',exact:true}).press('End');
   if(width===390){failUpload=true;await confirm(preview).click();await preview.getByRole('alert').filter({hasText:'Synthetic avatar upload unavailable'}).waitFor();assert.equal(avatar,old);assert.equal(await page.locator('.settings-profile img').getAttribute('src'),old);failUpload=false;}
   const response=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/files'&&r.status()===201);await confirm(preview).evaluate(button=>{button.click();button.click()});await response;await preview.waitFor({state:'hidden'});await current(next);assert.deepEqual(crops.at(-1),{x:0,y:1,zoom:3});assert.equal(uploads,before+(width===390?2:1),'Same-frame confirmation makes only one upload');
   if(width===390)assert.equal(keys.at(-1),keys.at(-2),'Failed upload retries the same file/crop with the same key');
   await editor.getByRole('button',{name:'Abbrechen',exact:true}).click();await editor.waitFor({state:'hidden'});
   await page.waitForFunction(value=>[...document.querySelectorAll('.avatar-button .person-avatar img')].some(img=>img.getAttribute('src')===value),next);await reload();await current(next);await capture(width+'-persisted');
  }
  // Quarantine never replaces the active image, even after explicit adoption.
  avatar=old;verdict='pending';page=await navigate(base+'/einstellungen/konto');await current(old);const editor=await open();let preview=await select();await confirm(preview).click();await preview.waitFor({state:'hidden'});await editor.getByRole('alert').filter({hasText:'Das Profilbild wartet auf die Sicherheitsprüfung.'}).waitFor();assert.equal(avatar,old);await editor.getByRole('button',{name:'Bild übernehmen',exact:true}).click();await editor.getByRole('alert').filter({hasText:'Das Profilbild ist noch nicht sicher freigegeben.'}).waitFor();assert.equal(avatar,old);
  verdict='clean';await editor.getByRole('button',{name:'Bild übernehmen',exact:true}).click();await current(next);
  failRemove=true;await editor.getByRole('button',{name:'Entfernen',exact:true}).click();await editor.getByRole('alert').filter({hasText:'Synthetic avatar removal unavailable'}).waitFor();assert.equal(avatar,next);failRemove=false;
  const removed=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/files/'+id&&r.request().method()==='DELETE'&&r.status()===200);await editor.getByRole('button',{name:'Entfernen',exact:true}).click();await removed;await page.waitForFunction(()=>!document.querySelector('.settings-profile .person-avatar img'));await editor.getByRole('button',{name:'Abbrechen',exact:true}).click();await reload();await page.locator('.settings-profile .person-avatar').getByText('SU',{exact:true}).waitFor();assert.equal(avatar,'');assert.equal(removals,2);await capture('removed-initials');
 }catch(error){await capture('failure');throw error;}finally{for(const [pattern,handler] of registrations)await context.unroute(pattern,handler);}
 console.log('Avatar browser: camera input, adjustable crop, no upload on select/cancel, explicit/replayed confirmation, failure preserves old image, quarantine, replacement/removal, reload/header consistency and desktop/tablet/mobile/short-height geometry passed. Physical camera/PWA acceptance is separate.');
}
