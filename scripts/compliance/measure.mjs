import path from 'node:path';
import fs from 'node:fs/promises';
import {writeTestOutput} from '../test-output.mjs';
import {identity} from './identity.mjs';
import {createHash} from 'node:crypto';
const runIdentity=identity();
const baselineFile='ux-compliance/navigation-baseline.v4.json';
const navigationBaseline=await fs.readFile(baselineFile,'utf8').then(JSON.parse).catch(()=>null);
export async function measureActionClearance(page){
 return page.evaluate(async()=>{
  const nav=document.querySelector('.bottom-nav');if(!nav?.getClientRects().length||document.querySelector('[role=dialog]'))return null;
  const old={x:scrollX,y:scrollY},deadline=performance.now()+3000;
  let stable=0,previous=null,atEnd=false;
  // Route effects and late document growth can reset the first scroll. Prove the
  // endpoint before comparing geometry; two RAFs alone never prove scroll end.
  while(performance.now()<deadline){
   window.scrollTo({left:0,top:document.documentElement.scrollHeight,behavior:'instant'});
   await new Promise(r=>requestAnimationFrame(r));
   const endpoint=Math.max(0,document.scrollingElement.scrollHeight-innerHeight);
   atEnd=Math.abs(scrollY-endpoint)<=1;
   stable=atEnd&&previous!==null&&Math.abs(previous-endpoint)<=1?stable+1:0;
   previous=endpoint;if(stable>=2)break;
  }
  const navRect=nav.getBoundingClientRect(),main=document.querySelector('.page-container');
  const actions=main?[...main.querySelectorAll('button,a,input,select,textarea')].filter(el=>el.checkVisibility()&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&!el.closest('[hidden],[inert],[aria-hidden=true]')):[];
  const bottom=actions.length?Math.max(...actions.map(el=>el.getBoundingClientRect().bottom)):null;
  const plus=document.querySelector('.dock-create-action');const plusTop=plus?.getClientRects().length?plus.getBoundingClientRect().top:navRect.top;
  const observed={lastActionBottom:bottom,navigationTop:Math.min(navRect.top,plusTop),scrollY,scrollEndpoint:previous,scrollEndEstablished:atEnd&&stable>=2};
  window.scrollTo({left:old.x,top:old.y,behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return observed;
 });
}
/** DOM-only measurements: no customer text or record values in the evidence. */
export async function measureCompliance(page,{output,route,theme,width,state='normal',engine='chromium'}){
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 const measured=await page.evaluate(()=>{
  const visible=el=>{
   const r=el.getBoundingClientRect(),c=getComputedStyle(el);
   if(!el.checkVisibility()||!el.getClientRects().length||c.visibility==='hidden'||c.display==='none'||el.closest('[hidden],[inert],[aria-hidden=true]')||r.width<=0||r.height<=0||r.right<=v.x||r.bottom<=v.y||r.x>=v.x+v.width||r.y>=v.y+v.height)return false;
   for(let p=el.parentElement;p;p=p.parentElement){const pc=getComputedStyle(p);if(/hidden|clip|auto|scroll/.test(pc.overflowY)){const b=p.getBoundingClientRect();if(r.bottom<=b.top||r.top>=b.bottom)return false;}}
   return true;
  };
  const all=s=>[...document.querySelectorAll(s)].filter(visible);
  const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
  const item=el=>({tag:el.tagName,classes:typeof el.className==='string'?el.className:'svg',rect:rect(el)});
  const within=(r,v)=>r.x>=v.x-1&&r.y>=v.y-1&&r.right<=v.x+v.width+1&&r.bottom<=v.y+v.height+1;
  const v=visualViewport?{x:visualViewport.offsetLeft,y:visualViewport.offsetTop,width:visualViewport.width,height:visualViewport.height}:{x:0,y:0,width:innerWidth,height:innerHeight};
  const checks=[];
  const add=(id,status,observed,selector)=>checks.push({id:'UX-'+id,status,observed,selector});
  add('LAY-001',Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)<=innerWidth+1?'passed':'failed',{viewport:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth},'html,body');
  const dialogs=all('[role=dialog],[role=alertdialog]');const activeDialog=dialogs.at(-1);
  const fields=all('.form-field').filter(el=>!activeDialog||activeDialog.contains(el));const overlaps=[];
  for(let i=0;i<fields.length;i++)for(let j=i+1;j<fields.length;j++){if(fields[i].contains(fields[j])||fields[j].contains(fields[i]))continue;const a=rect(fields[i]),b=rect(fields[j]);if(Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1)overlaps.push({a:i,b:j,rectA:a,rectB:b});}
  if(fields.length)add('LAY-006',overlaps.length?'failed':'passed',{fields:fields.length,overlaps},'.form-field');
  const clipped=fields.flatMap((el,index)=>{const label=el.querySelector(':scope>span');if(!label)return [];const r=rect(label),range=document.createRange();range.selectNodeContents(label);return [...range.getClientRects()].some(t=>t.left<r.x-1||t.right>r.right+1)?[{index,rect:r}]:[]});
  if(fields.length)add('LAY-007',clipped.length?'failed':'passed',{clipped},'.form-field>span');
  const dividers=all('hr,[role=separator]'),doubled=[];for(let i=1;i<dividers.length;i++){const a=rect(dividers[i-1]),b=rect(dividers[i]);if(Math.abs(a.x-b.x)<=1&&Math.abs(a.width-b.width)<=1&&Math.abs(b.y-a.bottom)<=2)doubled.push({a,b});}
  if(dividers.length)add('LAY-005',doubled.length?'failed':'passed',{dividers:dividers.length,doubled},'hr,[role=separator]');
  for(const el of all('.toolbar:has(.searchbox):has(.filter-button),.record-controls,.records-inline-controls')){
   const search=all('.searchbox').find(x=>el.contains(x)),filter=el.querySelector('.filter-button,.records-filter-action');const tabs=el.querySelector('.chips,.tabs');
   if(innerWidth<=760&&search&&filter&&visible(filter)){const a=rect(search),b=rect(filter),t=tabs&&visible(tabs)?rect(tabs):null;add('CTL-001',b.x>=a.right-2&&Math.abs(a.y-b.y)<=2&&Math.abs(a.height-b.height)<=2&&(!t||t.y>=a.bottom-1)?'passed':'failed',{search:a,filter:b,tabs:t},'.toolbar,.record-controls,.records-inline-controls');}
   const sort=[...el.querySelectorAll('.records-sort-control [role=combobox],select[aria-label*=Sort],button[aria-label*=Sort]:not(.records-filter-action,.filter-button,.filter-chip,.records-reset)')].filter(visible);
   add('CTL-003',sort.length<=1?'passed':'failed',{visibleSorts:sort.length,controls:sort.map(item)},'.record-controls,.records-inline-controls');
  }
  for(const el of all('.tabs,.chips')){const c=getComputedStyle(el);add('CTL-002',el.scrollWidth<=el.clientWidth+1||['auto','scroll'].includes(c.overflowX)?'passed':'failed',{clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,overflowX:c.overflowX},'.tabs,.chips');}
  for(const el of all('.mobile-header'))add('HDR-001',getComputedStyle(el).backdropFilter==='none'?'passed':'failed',{backdropFilter:getComputedStyle(el).backdropFilter,background:getComputedStyle(el).backgroundColor,rect:rect(el)},'.mobile-header');
  for(const el of all('.desktop-appbar-actions'))if(innerWidth>=1024){
   const actions=[...el.querySelectorAll('button,a')].filter(visible);
   // V4: page management stays outside the global overview/list header.
   const kind=x=>x.matches('button.desktop-global-search[aria-label]')&&x.getAttribute('aria-label').trim()?'search':x.matches('button.desktop-notification-button')?'notification':x.matches('button.avatar-button')?'account':'unexpected';
   const roles=actions.map(kind),unexpected=actions.filter(x=>kind(x)==='unexpected');
   const outside=[...el.closest('.desktop-appbar').querySelectorAll('button,a')].filter(visible).filter(x=>!el.contains(x)&&!x.matches('button.desktop-navigation-toggle[aria-controls="customer-desktop-navigation"]'));
   const validOrder=roles.join(',')==='search,notification,account';
   const redundantLocation=[...el.closest('.desktop-appbar').querySelectorAll('.workspace-location')].filter(visible);
   add('LAY-003',validOrder&&!unexpected.length&&!outside.length&&!redundantLocation.length?'passed':'failed',{visibleActions:actions.length,roles,unexpectedActions:[...unexpected,...outside].map(item),redundantLocation:redundantLocation.map(item),rects:actions.map(item)},'.desktop-appbar-actions');
  }
  for(const el of dialogs.filter(el=>el===activeDialog))add('SHT-001',within(rect(el),v)?'passed':'failed',{rect:rect(el),visualViewport:v},'[role=dialog],[role=alertdialog]');
  for(const el of all('.mobile-sticky-save,.filter-sheet-actions')){const c=getComputedStyle(el);if(['sticky','fixed'].includes(c.position)||el.closest('[role=dialog]')){const actions=[...el.querySelectorAll('button,a,input[type=submit]')].filter(a=>a.getClientRects().length&&getComputedStyle(a).visibility!=='hidden'&&getComputedStyle(a).display!=='none').map(rect);add('SHT-002',actions.length?actions.every(r=>within(r,v))?'passed':'failed':'not-tested',{container:rect(el),actions,visualViewport:v,criterion:'Actual action targets, not decorative edge-to-edge footer background'},'.mobile-sticky-save,.filter-sheet-actions');}}
  for(const el of all('.bo-cash-overview')){const count=el.querySelector(':scope > .bo-metric-tiles')?.querySelectorAll(':scope > .metric').length??0;add('FIN-001',count===4?'passed':'failed',{count,expected:4,contract:'Current approval: four compact overview metrics'},'.bo-cash-overview > .bo-metric-tiles');}
  for(const el of all('.bo-statistics')){
   const count=el.querySelector(':scope > .bo-metric-tiles')?.querySelectorAll(':scope > .metric').length??0;const expectedKpis=location.pathname.startsWith('/kunden/')?3:4;add('FIN-001',count===expectedKpis?'passed':'failed',{count,expected:expectedKpis,contract:'Finance Final V1: four analysis/overview metrics; existing three customer-development metrics'},'.bo-metric-tiles');
   if(location.pathname==='/finanzen/analyse'){
    const comparison=el.querySelector('.bo-comparison-card'),rows=[...el.querySelectorAll('.bo-comparison-row')];
    const bars=rows.map(row=>({positive:row.querySelectorAll('.bo-comparison-track>.bo-statistics-positive').length,negative:row.querySelectorAll('.bo-comparison-track>.bo-statistics-negative').length,value:!!row.querySelector('strong')?.textContent?.trim(),height:row.querySelector('.bo-comparison-track')?.getBoundingClientRect().height}));
    const period=!!comparison?.querySelector('header>span')?.textContent?.trim(),balance=!!comparison?.querySelector('footer>strong')?.textContent?.trim();
    add('FIN-002',bars.length===2&&bars[0].positive===1&&bars[0].negative===0&&bars[1].negative===1&&bars[1].positive===0&&bars.every(bar=>bar.value&&bar.height===8)&&period&&balance?'passed':'failed',{bars,period,balance,contract:'Finance Final V1: two compact ledger comparison bars, shared period and balance'},'.bo-comparison-card');
   }else{
    const legend=el.querySelector('.bo-statistics-legend')?.textContent??'';const groups=[...el.querySelectorAll('.bo-statistics-line')].map(x=>x.points.numberOfItems);if(['/dashboard','/finanzen'].includes(location.pathname))add('FIN-002',legend.includes('Einnahmen')&&legend.includes('Ausgaben')&&groups.length===2&&groups.every(n=>n>0)?'passed':'failed',{income:legend.includes('Einnahmen'),expenses:legend.includes('Ausgaben'),linePointCounts:groups},'.bo-statistics');
   }
   const color=tone=>{const node=el.querySelector('.bo-statistics-'+tone);return node?getComputedStyle(node).backgroundColor:null};const positive=color('positive'),negative=color('negative');const rgb=value=>(value??'').match(/[\d.]+/g)?.map(Number)??[];const p=rgb(positive),n=rgb(negative);if(['/dashboard','/finanzen','/finanzen/analyse'].includes(location.pathname))add('FIN-003',p[1]>p[0]&&p[1]>p[2]&&n[0]>n[1]&&n[0]>n[2]?'passed':'failed',{positive,negative},'.bo-statistics-positive,.bo-statistics-negative');
   const control=el.querySelector('.bo-period-control'),segments=control?.querySelector('.bo-period-segments'),mobile=control?.querySelector('.bo-period-mobile');
   const presets=segments?[...segments.querySelectorAll('button:not([aria-haspopup])')]:[],calendar=segments?.querySelector('button[aria-haspopup="dialog"]');
   const active=segments?[...segments.querySelectorAll('button[aria-pressed="true"]')]:[];
   const periods=presets.map(b=>Number(b.textContent.trim().split(/\s+/)[0]));
   const mode=innerWidth<1024?'mobile':'desktop';
   const valid=periods.length===4&&periods.every((n,i)=>n===[1,3,6,12][i])&&active.length===1&&!!calendar&&!!mobile&&mobile.getAttribute('aria-haspopup')==='dialog'&&!!mobile.textContent.trim()&&(mode==='mobile'?visible(mobile)&&!visible(segments):visible(segments)&&!visible(mobile));
   add('FIN-004',valid?'passed':'failed',{periods,active:active.length,mode,mobileVisible:!!mobile&&visible(mobile),segmentsVisible:!!segments&&visible(segments),calendar:!!calendar},'.bo-period-control');
   const token='--color-bg';
   const probe=document.createElement('span');probe.style.backgroundColor=`var(${token})`;document.body.append(probe);const expected=getComputedStyle(probe).backgroundColor;probe.remove();const actual=getComputedStyle(el).backgroundColor;
   add('FIN-010',actual===expected?'passed':'failed',{actual,expected,token,approval:'2026-10-15 ZIP: open workspace at every viewport; Dark uses derived canvas tokens without visual approval'},'.bo-statistics');
  }
  const selectors=['.page-container','.page-head','.section-title','.record-controls','.bo-statistics','.bo-statistics-plot','.bo-statistics-axis','.bottom-nav','.form-wizard','.bottom-sheet','.form-actions'];
  const surfaces=selectors.flatMap(selector=>all(selector).slice(0,12).map(el=>{const c=getComputedStyle(el);return {selector,...item(el),css:{padding:c.padding,margin:c.margin,gap:c.gap,background:c.backgroundColor,border:c.border,overflowX:c.overflowX,fontSize:c.fontSize,position:c.position}}}));
  return {viewport:v,checks,surfaces,navigation:all('.bottom-nav').map(el=>({rect:rect(el),position:getComputedStyle(el).position,borderRadius:getComputedStyle(el).borderRadius,bottomOffset:innerHeight-el.getBoundingClientRect().bottom,withCreate:!!document.querySelector('.mobile-dock .dock-create-action')?.getClientRects().length,links:[...el.querySelectorAll('a')].map(a=>({href:a.getAttribute('href'),rect:rect(a)}))}))};
 });
 // Last reachable action at scroll end; measure only outside dialogs/editors. Restore scroll without firing navigation clicks.
 const clearance=await measureActionClearance(page);
 if(clearance?.lastActionBottom!==null&&clearance)measured.checks.push({id:'UX-LAY-008',status:clearance.scrollEndEstablished&&clearance.lastActionBottom<=clearance.navigationTop+1?'passed':'failed',selector:'.page-container,.bottom-nav',observed:clearance});
 const evidence={schemaVersion:1,...runIdentity,engine,route,theme,width,state,scope:'Synthetic API fixtures; desktop engine emulation; no native keyboard proof',...measured};
 if(measured.navigation.length){
  const observed=measured.navigation[0];
  const reference=state==='normal'?navigationBaseline?.cases.find(c=>c.theme===theme&&c.width===width&&c.withCreate===observed.withCreate):null;
  const same=reference&&['x','width','height'].every(k=>Math.abs(observed.rect[k]-reference.navigation[k])<=1)&&Math.abs(observed.bottomOffset-reference.navigation.bottomOffset)<=1&&observed.position===reference.navigation.position&&observed.borderRadius===reference.navigation.borderRadius&&JSON.stringify(observed.links.map(l=>l.href))===JSON.stringify(reference.navigation.links);
  evidence.checks.push({id:'UX-NAV-003',status:reference?(same?'passed':'failed'):'not-tested',selector:'.bottom-nav',observed:{current:observed,reference:reference?.navigation??null,baselineCommit:navigationBaseline?.commit??null,reason:reference?null:'No explicitly captured protected baseline for this viewport/theme/state'}});
 }
 const filename=path.join(output,'compliance-'+createHash('sha256').update(JSON.stringify([engine,route,theme,width,state])).digest('hex').slice(0,20)+'.json');
 await fs.mkdir(output,{recursive:true});await writeTestOutput(filename,JSON.stringify(evidence,null,2)+'\n');return evidence;
}
