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
 const create=page.locator('.mobile-header .bo-create-action').filter({visible:true});
 if(await create.count()){
  const geometry=await create.evaluate(el=>{const r=el.getBoundingClientRect(),i=el.querySelector('svg').getBoundingClientRect(),p=getComputedStyle(el,'::before'),a=document.querySelector('.mobile-header .person-avatar').getBoundingClientRect();return {width:r.width,height:r.height,circle:parseFloat(p.width),avatar:a.width,dx:Math.abs((i.left+i.width/2)-(r.left+r.width/2)),dy:Math.abs((i.top+i.height/2)-(r.top+r.height/2))}});
  assert.ok(geometry.width>=44&&geometry.height>=44,'Compact visible circle retains a full touch target');assert.equal(geometry.circle,geometry.avatar,'Create and avatar share a visible diameter');assert.ok(geometry.dx<=1&&geometry.dy<=1,'Plus stays centered without an empty label wrapper');
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
   ['.mobile-header .bo-create-action::before{width:44px!important}',/visible diameter/],
   ['.mobile-header .bo-create-action svg{transform:translateX(4px)!important}',/Plus stays centered/],
  ]){
   if(css.includes('bo-create-action')&&!await page.locator('.mobile-header .bo-create-action').filter({visible:true}).count())continue;
   const regression=await page.addStyleTag({content:css});
   try{await assert.rejects(()=>assertStableAppNavigation(page),error,'Retired floating/oversized/shifted presentation must fail');}finally{await regression.evaluate(el=>el.remove())}
  }
  const safe=await page.addStyleTag({content:':root{--safe-bottom:34px}'});
  try{await assertStableAppNavigation(page)}finally{await safe.evaluate(el=>el.remove())}
 }finally{await page.evaluate(y=>window.scrollTo(0,y),initial)}
}
