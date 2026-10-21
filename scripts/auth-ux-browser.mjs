import assert from 'node:assert/strict';

/** Computed geometry, not a CSS-source or screenshot-baseline assertion. */
async function assertMobileAuthGeometry(page){
 const geometry=await page.evaluate(()=>{
  const heading=document.querySelector('.auth-card h1');
  const targets=[...document.querySelectorAll('.auth-options>label,.auth-inline-action,.auth-cancel')]
   .filter(node=>node.getClientRects().length)
   .map(node=>({tag:node.tagName,height:node.getBoundingClientRect().height}));
  return {font:getComputedStyle(heading).fontSize,expected:getComputedStyle(heading).getPropertyValue('--type-mobile-heading').trim(),targets};
 });
 assert.equal(geometry.font,geometry.expected,'Auth heading uses the shared mobile heading token');
 assert.ok(geometry.targets.length>0,'The actual auth state must expose checked action targets');
 for(const target of geometry.targets)assert.ok(target.height>=44,'Auth touch target must be at least 44px: '+JSON.stringify(target));
}

/** Real login handlers, isolated 202 response; never contacts a tenant or sends mail. */
export async function verifyMobileLoginGeometry(page,{captureCode}={}){
 await assertMobileAuthGeometry(page);
 // Negative control: the same browser assertion must reject a regressed hit area.
 const regression=await page.addStyleTag({content:'.auth-options>label{min-height:18px!important;height:18px!important}'});
 try{await assert.rejects(()=>assertMobileAuthGeometry(page),/Auth touch target must be at least 44px/);}
 finally{await regression.evaluate(node=>node.remove());}
 await assertMobileAuthGeometry(page);

 const originalUrl=page.url();let requests=0,mode='totp';
 const fixture=async route=>{requests++;await route.fulfill({status:mode==='password'?200:202,contentType:'application/json',body:JSON.stringify(mode==='password'?{ok:true,next:'/dashboard'}:mode==='verify'?{requiresEmailVerification:true}:{mfaMethod:'totp'})});};
 await page.route('**/api/auth/login',fixture);
 try{
  await page.locator('.auth-card input[type="email"]').fill('auth-ux@example.invalid');
  await page.locator('.auth-card input[autocomplete="current-password"]').fill('Isolated-UX-Fixture-Only');
  await page.locator('.auth-card button[type="submit"]').click();
  await page.getByRole('heading',{name:'Authenticator-Code',exact:true}).waitFor();
  assert.equal(await page.locator('.auth-inline-action').count(),1,'An enrolled authenticator has a back action, never an email-factor fallback');
  await assertMobileAuthGeometry(page);

  const back=page.getByRole('button',{name:'Zurück',exact:true});
  await back.focus();await page.keyboard.press('Enter');
  await page.locator('.auth-options>label').waitFor();
  await assertMobileAuthGeometry(page);
  assert.equal(requests,1,'Exactly one isolated credential request; no resend/test email');
  mode='verify';await page.locator('.auth-card button[type="submit"]').click();await page.getByRole('heading',{name:'E-Mail bestätigen',exact:true}).waitFor();assert.equal(await page.locator('.auth-inline-action').count(),2,'Unverified registration retains resend and back actions');await assertMobileAuthGeometry(page);if(captureCode)await captureCode();await page.getByRole('button',{name:'Zurück',exact:true}).click();await page.locator('.auth-options>label').waitFor();assert.equal(requests,2);
  mode='password';await page.locator('.auth-card button[type="submit"]').click();await page.waitForURL('**/dashboard');await page.waitForLoadState('networkidle');assert.equal(requests,3,'Verified ordinary password login reaches the workspace with one request and no email-MFA step');await page.goto(originalUrl);await page.locator('.auth-options>label').waitFor();await assertMobileAuthGeometry(page);
  await page.locator('.auth-card input[type="email"]').fill('');
  await page.locator('.auth-card input[autocomplete="current-password"]').fill('');
  await page.locator('.auth-card h1').click();
 }finally{await page.unroute('**/api/auth/login',fixture);}
}
