import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';

const source=await fs.readFile('components/use-navigation-scroll.ts','utf8');
const compiled=ts.transpileModule(source.replace(/^import .*$/gm,''),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const saved={},names=['window','document','location','Element','ResizeObserver','requestAnimationFrame','cancelAnimationFrame'];
for(const key of names)saved[key]=globalThis[key];
const store=new Map(),refs=[],effects=[],layouts=[],frames=new Map();let cursor=0,frameId=0,cleanups=[];
const window=new EventTarget(),document=new EventTarget();
class Element{constructor(href,back=true){this.href=href;this.back=back}closest(){return this}matches(selector){return this.back&&selector.includes('.mobile-back')}}
const location={origin:'https://fixture.invalid',href:'https://fixture.invalid/einstellungen',pathname:'/einstellungen',search:''};
window.scrollY=0;window.scrollTo=({top})=>{window.scrollY=top};window.setTimeout=()=>1;window.clearTimeout=()=>{};document.body={};
Object.assign(globalThis,{window,document,location,Element,ResizeObserver:class{observe(){}disconnect(){}},requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId},cancelAnimationFrame:id=>frames.delete(id)});
const result={};
try{
 Function('exports','useEffect','useLayoutEffect','useRef','listStateStore',compiled)(result,fn=>effects.push(fn),fn=>layouts.push(fn),value=>refs[cursor++]??(refs[cursor-1]={current:value}),store);
 const render=path=>{location.pathname=path;location.href=location.origin+path;cursor=0;result.useNavigationScroll(path);layouts.pop()()};
 render('/einstellungen');cleanups=effects.splice(0).map(fn=>fn());
 window.scrollY=460;window.dispatchEvent(new Event('scroll'));
 const departure=new Event('click');Object.defineProperties(departure,{target:{value:new Element(location.origin+'/einstellungen/zeiterfassung',false)},button:{value:0}});document.dispatchEvent(departure);window.scrollY=0;window.dispatchEvent(new Event('scroll'));assert.equal(store.get('binso.navigation:/einstellungen'),'460','Departure reset cannot erase the overview position');
 render('/einstellungen/zeiterfassung');window.scrollY=0;window.dispatchEvent(new Event('scroll'));
 location.pathname='/einstellungen';location.href=location.origin+location.pathname;window.dispatchEvent(new Event('popstate'));render('/einstellungen');
 for(const fn of frames.values())fn();frames.clear();
 assert.equal(window.scrollY,460,'Native back restores the original settings position');
 window.scrollY=620;window.dispatchEvent(new Event('scroll'));
 render('/einstellungen/sicherheit');window.scrollY=0;
 const click=new Event('click');Object.defineProperties(click,{target:{value:new Element(location.origin+'/einstellungen')},button:{value:0}});document.dispatchEvent(click);
 window.scrollY=0;window.dispatchEvent(new Event('scroll'));assert.equal(store.get('binso.navigation:/einstellungen'), '620','Route reset cannot overwrite the captured return position');
 render('/einstellungen');for(const fn of frames.values())fn();frames.clear();
 assert.equal(window.scrollY,620,'Header back and native back share the same restoration');
 render('/kunden');assert.equal(frames.size,0,'New navigation never replays another route’s position');
 assert.ok([...store.keys()].every(key=>key.startsWith('binso.navigation:')));
 console.log('Navigation return: real hook, native/header back, route isolation and no restoration on forward navigation passed.');
}finally{for(const cleanup of cleanups)cleanup?.();Object.assign(globalThis,saved)}
