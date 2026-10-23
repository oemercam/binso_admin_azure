import assert from 'node:assert/strict';
import {waitForFiniteAnimations} from './shared-control-browser.mjs';

export async function assertFlatMobileNavigation(page){
 await waitForFiniteAnimations(page);
 const material=await page.locator('.bottom-nav,.operator-mobile-nav').evaluateAll(nodes=>nodes.filter(el=>el.checkVisibility()).map(el=>{const c=getComputedStyle(el),r=el.getBoundingClientRect();return {background:c.backgroundColor,radius:c.borderRadius,shadow:c.boxShadow,blur:c.backdropFilter,webkitBlur:c.webkitBackdropFilter,theme:document.documentElement.dataset.theme,active:[...el.querySelectorAll('.active')].map(a=>getComputedStyle(a).color),labels:[...el.querySelectorAll(":scope > a > span,:scope > button > span")].filter(a=>a.checkVisibility()&&a.getBoundingClientRect().height>0&&getComputedStyle(a).opacity!=="0").map(a=>({text:a.textContent,name:a.parentElement.getAttribute("aria-label")??a.textContent,font:parseFloat(getComputedStyle(a.parentElement).fontSize),height:a.clientHeight,scroll:a.scrollHeight,clientWidth:a.clientWidth,scrollWidth:a.scrollWidth,width:a.getBoundingClientRect().width,targetWidth:a.parentElement.getBoundingClientRect().width})),targets:[...el.children].map(a=>({width:a.getBoundingClientRect().width,height:a.getBoundingClientRect().height})),left:r.left,right:r.right,viewport:innerWidth}}));
 for(const nav of material){
  assert.equal(nav.background,nav.theme==='dark'?'rgb(0, 0, 0)':'rgb(255, 255, 255)','Flat navigation uses the opaque theme canvas');
  assert.equal(nav.radius,'0px','Flat navigation has straight edges');
  assert.equal(nav.shadow,'none','Flat navigation has no glass shadow');
  assert.equal(nav.blur,'none','Flat navigation has no backdrop blur');
  assert.ok(!nav.webkitBlur||nav.webkitBlur==='none','Flat navigation has no WebKit backdrop blur');
  assert.ok(nav.active.every(color=>color===(nav.theme==='dark'?'rgb(72, 167, 255)':'rgb(37, 102, 189)')),'Active navigation uses the Microsoft blue accent');
  assert.ok(nav.targets.every(t=>t.width>=44&&t.height>=44),'Existing navigation touch targets remain at least 44px');
  assert.equal(nav.labels.length,nav.targets.length,'Every navigation target keeps a visible label');
  assert.ok(nav.labels.every(label=>label.name.includes(label.text)),"Navigation accessible names include their visible localized label");
  assert.ok(nav.labels.every(label=>label.font>=12&&label.scroll<=label.height+1&&label.width<=label.targetWidth+1&&label.scrollWidth<=label.clientWidth+1),'Flat navigation labels remain readable without clipping: '+JSON.stringify(nav.labels));
  assert.ok(nav.left>=0&&nav.right<=nav.viewport+1,'Navigation stays inside its safe viewport');
 }
}

export async function verifyFlatNavigationAdversaries(page){
 const nav=page.locator('.bottom-nav').filter({visible:true});const original=await nav.getAttribute('style');
 try{
  for(const [property,value] of [['background-color','rgb(243, 243, 245)'],['border-radius','30px'],['backdrop-filter','blur(18px)'],['box-shadow','0 3px 12px rgba(0,0,0,.2)']]){
   await nav.evaluate((el,[p,v])=>el.style.setProperty(p,v),[property,value]);
   await waitForFiniteAnimations(page);
   await assert.rejects(()=>assertFlatMobileNavigation(page),/Flat navigation/,'Old glass/round/blur styling must fail at runtime');
   await nav.evaluate((el,style)=>style===null?el.removeAttribute('style'):el.setAttribute('style',style),original);
   await waitForFiniteAnimations(page);
  }
  const targets=nav.locator(':scope > a, :scope > button');
  const labelTarget=targets.first(),labelStyle=await labelTarget.getAttribute('style');
  try{await labelTarget.evaluate(el=>el.style.setProperty('font-size','9px','important'));await assert.rejects(()=>assertFlatMobileNavigation(page),/labels remain readable/,'Tiny navigation labels must fail at runtime');}
  finally{await labelTarget.evaluate((el,style)=>style===null?el.removeAttribute('style'):el.setAttribute('style',style),labelStyle);}
  const label=labelTarget.locator(':scope > span'),spanStyle=await label.getAttribute('style');
  try{await label.evaluate(el=>el.style.setProperty('max-width','10px','important'));await assert.rejects(()=>assertFlatMobileNavigation(page),/labels remain readable/,'Horizontally clipped navigation labels must fail at runtime');}
  finally{await label.evaluate((el,style)=>style===null?el.removeAttribute('style'):el.setAttribute('style',style),spanStyle);}
  await targets.first().focus();await targets.first().press('Tab');
  assert.equal(await targets.nth(1).evaluate(el=>el===document.activeElement),true,'Native keyboard navigation retains destination order');
  await targets.nth(1).evaluate(el=>el.blur());await assertFlatMobileNavigation(page);
 }finally{await nav.evaluate((el,style)=>style===null?el.removeAttribute('style'):el.setAttribute('style',style),original);}
}

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
   assert.equal(await page.locator('.settings-mobile-navigation').count(),0,'No retired hamburger or duplicate current-section strip');
   if(railVisible){
    const settings=page.locator('.settings-context-navigation');await settings.getByRole('link',{name:'Darstellung',exact:true}).click();await page.waitForURL(base+'/einstellungen/darstellung');assert.equal(await settings.locator('a[aria-current="page"]').getAttribute('href'),'/einstellungen/darstellung','Visible settings siblings announce the current page');
   }else{
    await page.locator('.mobile-back,.desktop-back').filter({visible:true}).click();await page.waitForURL(base+'/einstellungen');await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('.settings-overview').getByRole('link',{name:'Darstellung',exact:true}).count(),0,'V4.1 company settings do not duplicate personal preferences');
    await page.getByRole('button',{name:'Benutzerkonto',exact:true}).filter({visible:true}).click();
    await page.locator('.account-sheet').getByRole('link',{name:'Darstellung',exact:true}).click();await page.waitForURL(url=>url.pathname==='/einstellungen/darstellung');
    assert.equal(new URL(page.url()).searchParams.get('accountReturn'),'/einstellungen?panel=account','Personal preferences preserve the invoking account menu');
   }
   await page.getByRole('radiogroup',{name:'Darstellung',exact:true}).waitFor({state:'visible'});assert.ok(await page.getByRole('radiogroup',{name:'Darstellung',exact:true}).isVisible(),'Existing appearance control remains reachable');
   await capture('settings-desktop-'+width);
  }
  await page.setViewportSize({width:390,height:840});
  await page.goto(base+'/einstellungen/konto');await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('.settings-context-navigation').isVisible(),false,'Desktop settings rail stays out of the phone flow');
  assert.equal(await page.locator('.settings-mobile-navigation').count(),0,'Phone settings use the overview without an extra hamburger');
  await page.locator('.mobile-back').click();await page.waitForURL(base+'/einstellungen');await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('.settings-overview').getByRole('link',{name:'Sicherheit',exact:true}).count(),0,'Security remains in the personal account area');
  await page.getByRole('button',{name:'Benutzerkonto',exact:true}).filter({visible:true}).click();
  const security=page.locator('.account-sheet').getByRole('link',{name:'Sicherheit',exact:true});await security.focus();await security.press('Enter');await page.waitForURL(url=>url.pathname==='/einstellungen/sicherheit');
  await page.getByRole('button',{name:'Passwort ändern',exact:true}).click();
  const password=page.getByRole('dialog',{name:'Passwort ändern',exact:true});
  assert.equal(await password.locator('input[type="password"]').count(),3,'Existing current/new/confirm password fields stay in the real shared form');
  assert.equal(await password.getByLabel('Aktuelles Passwort',{exact:true}).getAttribute('autocomplete'),'current-password');
  await password.getByRole('button',{name:'Schliessen',exact:true}).click();await password.waitFor({state:'hidden'});
  await capture('settings-mobile-sibling-navigation');
  const returnPath='/dashboard?panel=account';
  await page.goto(base+'/einstellungen/konto?accountReturn='+encodeURIComponent(returnPath));await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('.mobile-back').getAttribute('href'),returnPath,'Account preserves its original safe return path without a duplicate mobile menu');await page.locator('.mobile-back').click();await page.waitForURL(base+returnPath);
 }finally{await page.setViewportSize(viewport)}
}
