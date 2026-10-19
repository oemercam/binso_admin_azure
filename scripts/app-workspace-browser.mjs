import assert from 'node:assert/strict';

/** Shared shell assertions run in existing synthetic CI browser lanes. */
export async function assertStableAppNavigation(page){
 const nav=page.locator('.bottom-nav').filter({visible:true});
 if(!await nav.count())return;
 const result=await nav.evaluate(el=>{
  const dock=el.parentElement,r=dock.getBoundingClientRect(),c=getComputedStyle(dock);
  return {left:r.left,right:r.right,bottom:r.bottom,viewport:innerWidth,height:innerHeight,bg:c.backgroundColor,labels:[...el.querySelectorAll(':scope>a>span,:scope>button>span')].map(label=>({visible:label.checkVisibility()&&getComputedStyle(label).opacity!=='0'&&label.getBoundingClientRect().height>0,text:label.textContent})),targets:el.children.length};
 });
 assert.equal(result.left,0,'Dock background reaches the left edge');assert.equal(result.right,result.viewport,'Dock background reaches the right edge');assert.equal(result.bottom,result.height,'Dock background covers the bottom safe area');assert.notEqual(result.bg,'rgba(0, 0, 0, 0)','Dock cannot expose content through its background');
 assert.equal(result.labels.length,result.targets);assert.ok(result.labels.every(x=>x.visible),'Every label stays visible after scrolling');
 assert.equal(await page.locator('.mobile-header .bo-create-action').count(),0,'Creation belongs to content, never the header');
 const create=page.locator('.workspace-command-bar .bo-create-action').filter({visible:true});
 if(await create.count()){
  const geometry=await create.evaluate(el=>{const r=el.getBoundingClientRect(),i=el.querySelector('svg').getBoundingClientRect(),short=el.querySelector('.create-action-short'),label=short?.checkVisibility()?short:el.querySelector('.create-action-label'),text=label?.getBoundingClientRect();return {width:r.width,height:r.height,radius:getComputedStyle(el).borderRadius,label:label?.checkVisibility()&&text.width>0&&text.right<=r.right,name:el.getAttribute('aria-label'),position:getComputedStyle(el).position,right:r.right,bottom:r.bottom,dy:Math.abs((i.top+i.height/2)-(r.top+r.height/2))}});
  assert.ok(geometry.width>=44&&geometry.height>=44,'Content creation retains a full touch target');assert.ok(geometry.name,'Mobile creation keeps its accessible name');assert.equal(geometry.label,false,'Mobile creation uses its plus icon');assert.equal(geometry.radius,'50%','Approved mobile creation is circular');assert.equal(geometry.position,'fixed','One common mobile position');assert.ok(geometry.right<=result.viewport-12&&geometry.bottom<=(await nav.boundingBox()).y-8,'Creation respects the page and navigation inset');assert.ok(geometry.dy<=1,'Plus is vertically aligned with its action');
 }
}

export async function verifyStableAppNavigation(page){
 const initial=await page.evaluate(()=>scrollY);
 try{
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await assertStableAppNavigation(page);
  const old=await page.addStyleTag({content:'.bottom-nav> a>span,.bottom-nav>button>span{opacity:0!important}'});
  try{await assert.rejects(()=>assertStableAppNavigation(page),/label stays visible|label.*visible|Every label/,'Old disappearing labels must fail');}finally{await old.evaluate(el=>el.remove())}
  for(const [css,error] of [
   ['.mobile-dock{left:12px!important;right:12px!important}',/left edge|right edge/],
   ['.workspace-command-bar .bo-create-action{border-radius:5px!important}',/circular/],
   ['.workspace-command-bar .bo-create-action svg{transform:translateY(4px)!important}',/vertically aligned/],
  ]){
   if(css.includes('bo-create-action')&&!await page.locator('.workspace-command-bar .bo-create-action').filter({visible:true}).count())continue;
   const regression=await page.addStyleTag({content:css});
   try{await assert.rejects(()=>assertStableAppNavigation(page),error,'Retired floating/oversized/shifted presentation must fail');}finally{await regression.evaluate(el=>el.remove())}
  }
  if(await page.locator('.workspace-command-bar .bo-create-action').count()){
   await page.evaluate(()=>{const copy=document.querySelector('.workspace-command-bar .bo-create-action').cloneNode(true);copy.classList.add('regression-header-create');document.querySelector('.mobile-header').append(copy)});
   try{await assert.rejects(()=>assertStableAppNavigation(page),/never the header/);}finally{await page.locator('.regression-header-create').evaluate(el=>el.remove())}
  }
  const safe=await page.addStyleTag({content:':root{--safe-bottom:34px}'});
  try{await assertStableAppNavigation(page)}finally{await safe.evaluate(el=>el.remove())}
 }finally{await page.evaluate(y=>window.scrollTo(0,y),initial)}
}
