import assert from 'node:assert/strict';

export async function assertNavigationToggle(toggle,collapsed){
 assert.equal(await toggle.getAttribute('aria-expanded'),String(!collapsed),'Navigation exposes its current expanded state');
 assert.equal(await toggle.getAttribute('aria-label'),collapsed?'Navigation öffnen':'Navigation einklappen','Navigation names the next action, as in the Microsoft reference');
 const controls=await toggle.getAttribute('aria-controls');
 assert.ok(controls,'Navigation toggle identifies the controlled sidebar');
 assert.equal(await toggle.evaluate((el,id)=>!!el.ownerDocument.getElementById(id),controls),true,'Controlled sidebar exists');
}

/** Existing customer and operator shells share one preference and native control. */
export async function verifyNavigationPersistence(page,{base,capture=async()=>{}}){
 const viewport=page.viewportSize();await page.setViewportSize({width:1440,height:1000});
 try{
  await page.goto(base+'/kunden');await page.waitForLoadState('networkidle');
  const toggle=page.locator('.desktop-navigation-toggle');await assertNavigationToggle(toggle,false);
  await toggle.focus();await toggle.press('Space');await assertNavigationToggle(toggle,true);
  assert.equal(await toggle.evaluate(el=>el===document.activeElement),true,'Collapsing preserves keyboard focus');await capture('customer-collapsed');
  await page.reload();await page.waitForLoadState('networkidle');await assertNavigationToggle(toggle,true);
  await page.goto(base+'/operator');await page.waitForLoadState('networkidle');await assertNavigationToggle(toggle,true);await capture('operator-collapsed');
  for(const link of await page.locator('.operator-sidebar nav a').all())assert.ok(await link.getAttribute('aria-label'),'Icon rail links retain accessible names');
  await toggle.focus();await toggle.press('Enter');await assertNavigationToggle(toggle,false);await capture('operator-expanded');
  await page.goto(base+'/einstellungen');await page.waitForLoadState('networkidle');await assertNavigationToggle(toggle,false);
  assert.equal(await page.locator('.sidebar-bottom a[aria-current="page"]').getAttribute('href'),'/einstellungen','Settings announces the current destination');
  await page.goto(base+'/support');await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('.sidebar-bottom a[aria-current="page"]').getAttribute('href'),'/support','Support announces the current destination');
  await capture('customer-expanded');
  // The original Microsoft reference specifies a left desktop navigation, also
  // on compact desktop/tablet widths. A 1440px-only test missed the old dock.
  for(const width of [768,1024,1440]){
   await page.setViewportSize({width,height:1000});
   await page.goto(base+'/einstellungen/konto');await page.waitForLoadState('networkidle');
   await assertNavigationToggle(toggle,false);
   await toggle.focus();await toggle.press('Space');
   await assertNavigationToggle(toggle,true);
   const collapsedSidebar=await page.locator('.app-sidebar').boundingBox();
   assert.equal(Math.round(collapsedSidebar.width),68,'Collapsed navigation preserves an accessible icon rail');
   assert.equal(Math.round((await page.locator('.app-main').boundingBox()).x),68,'Workspace reclaims collapsed navigation space');
   assert.equal(await page.evaluate(()=>localStorage.getItem('binso.desktop-navigation')),'collapsed','Desktop preference survives navigation');
   assert.equal(await toggle.evaluate(el=>el===document.activeElement),true,'Collapsing preserves keyboard focus');
   await capture('settings-collapsed-'+width);
   await toggle.press('Enter');await assertNavigationToggle(toggle,false);
   assert.equal(await page.locator('.mobile-dock').isVisible(),false,'Desktop never falls back to the floating phone dock');
   const sidebar=await page.locator('.app-sidebar').boundingBox();
   const content=await page.locator('.page-container').boundingBox();
   assert.ok(sidebar&&sidebar.width>68&&content.x>=sidebar.x+sidebar.width,'Desktop content reserves its actual sidebar width');
   const railVisible=await page.locator('.settings-context-navigation').isVisible();
   const settings=page.locator(railVisible?'.settings-context-navigation':'.settings-mobile-navigation');
   if(!railVisible)await settings.locator('summary').click();
   await settings.getByRole('link',{name:'Darstellung & Sprache',exact:true}).click();
   await page.waitForURL(base+'/einstellungen/darstellung');
   assert.equal(await settings.getByRole('link',{name:'Darstellung & Sprache',exact:true}).getAttribute('aria-current'),'page','Settings siblings announce the current page');
   assert.ok(await page.getByRole('radiogroup',{name:'Darstellung',exact:true}).isVisible(),'Existing appearance control remains reachable');
   await capture('settings-desktop-'+width);
  }
  await page.setViewportSize({width:390,height:840});
  await page.goto(base+'/einstellungen/konto');await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('.settings-context-navigation').isVisible(),false,'Desktop settings rail stays out of the phone flow');
  const menu=page.locator('.settings-mobile-navigation');
  assert.equal(await menu.getAttribute('open'),null,'Phone settings menu starts compact');
  await menu.locator('summary').focus();await menu.locator('summary').press('Enter');
  await menu.getByRole('link',{name:'Sicherheit',exact:true}).click();await page.waitForURL(base+'/einstellungen/sicherheit');
  assert.equal(await menu.getAttribute('open'),null,'Changing page closes the phone menu without covering the form');
  await page.getByRole('button',{name:'Passwort ändern',exact:true}).click();
  const password=page.getByRole('dialog',{name:'Passwort ändern',exact:true});
  assert.equal(await password.locator('input[type="password"]').count(),3,'Existing current/new/confirm password fields stay in the real shared form');
  assert.equal(await password.getByLabel('Aktuelles Passwort',{exact:true}).getAttribute('autocomplete'),'current-password');
  await password.getByRole('button',{name:'Schliessen',exact:true}).click();await password.waitFor({state:'hidden'});
  await capture('settings-mobile-sibling-navigation');
  const returnPath='/dashboard?panel=account';
  await page.goto(base+'/einstellungen/konto?accountReturn='+encodeURIComponent(returnPath));await page.waitForLoadState('networkidle');
  await menu.locator('summary').click();await menu.getByRole('link',{name:'Darstellung & Sprache',exact:true}).click();
  await page.waitForURL(base+'/einstellungen/darstellung?accountReturn='+encodeURIComponent(returnPath));
  assert.equal(await page.locator('.detail-back').getAttribute('href'),returnPath,'Switching settings sections preserves the original safe account return path');
 }finally{await page.setViewportSize(viewport)}
}
