import assert from 'node:assert/strict';
/** Real public page/controls/viewer, isolated HTTP recipient-code responses.
 * Actual code/RLS/expiry semantics are covered by report-share-contract. */
export async function verifyPublicReport(page,{base,pdf,capture=async()=>{}}){
 const token='R'.repeat(43),requests=[],bodies=[];
 const request=next=>requests.push(next.url());page.on('request',request);
 const handler=async route=>{
  assert.equal(route.request().method(),'POST');const body=route.request().postDataJSON();bodies.push(body);assert.equal(body.token,token);
  if(body.action==='challenge')return route.fulfill({json:{providerAccepted:true,deliveryConfirmed:false}});
  assert.equal(body.action,'pdf');assert.match(body.key,/^[0-9a-f-]{36}$/i);
  if(body.code!=='123456')return route.fulfill({status:403,json:{message:'Der Code ist ungültig oder abgelaufen.'}});
  return route.fulfill({contentType:'application/pdf',body:pdf});
 };
 await page.route('**/api/public/report',handler);
 try{
  await page.goto(base+'/bericht?lang=de#'+token,{waitUntil:'networkidle'});await page.getByRole('button',{name:'Code anfordern',exact:true}).waitFor();assert.equal(bodies.length,0,'Visiting or scanning the link never requests email or PDF');assert.equal(await page.locator('canvas').count(),0,'No report contents before recipient proof');await capture('unverified');
  await Promise.all([page.waitForResponse(response=>response.url().endsWith('/api/public/report')),page.getByRole('button',{name:'Code anfordern',exact:true}).click()]);await page.getByLabel('Bestätigungscode',{exact:true}).waitFor();
  await page.getByLabel('Bestätigungscode',{exact:true}).fill('000000');await page.getByRole('button',{name:'Bericht öffnen',exact:true}).click();await page.getByRole('alert').getByText('Der Code ist ungültig oder abgelaufen.',{exact:true}).waitFor();assert.equal(await page.locator('canvas').count(),0);
  await page.getByLabel('Bestätigungscode',{exact:true}).fill('123456');await page.getByRole('button',{name:'Bericht öffnen',exact:true}).click();const viewer=page.getByRole('dialog',{name:'Berichte',exact:true});await viewer.locator('canvas[data-rendered-page="1"]').waitFor();
  assert.equal(bodies.filter(body=>body.action==='challenge').length,1);assert.equal(bodies.filter(body=>body.action==='pdf').length,2);assert.ok(requests.every(url=>!url.includes(token)),'Capability is never sent as an HTTP URL/query');await capture('verified-preview');
  await viewer.getByRole('button',{name:'Vorschau schliessen',exact:true}).click();await page.goto(base+'/bericht?lang=de',{waitUntil:'networkidle'});await page.getByText('Bitte den vollständigen Berichtslink aus deiner E-Mail öffnen.',{exact:true}).waitFor();assert.equal(bodies.length,3,'An incomplete link performs no operation');
  return {status:'passed',scope:'Actual public page with synthetic recipient-code API responses; no real mail or recipient delivery'};
 }finally{await page.unroute('**/api/public/report',handler);page.off('request',request);}
}
