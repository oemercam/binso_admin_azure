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
 }finally{await page.setViewportSize(viewport)}
}
