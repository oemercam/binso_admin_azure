/** Shared, nested overlay lock. Portalled lists must not unlock a parent dialog. */
const locks:Array<{root:()=>HTMLElement|null}>=[];
let bodyOverflow='',rootOverflow='',x=0,y=0;
const guard=(event:Event)=>{const root=locks.at(-1)?.root();if(root&&event.target instanceof Node&&!root.contains(event.target))event.preventDefault();};
export function lockPageScroll(root:()=>HTMLElement|null){
 const entry={root};
 if(!locks.length){bodyOverflow=document.body.style.overflow;rootOverflow=document.documentElement.style.overflow;x=scrollX;y=scrollY;document.body.style.overflow='clip';document.documentElement.style.overflow='hidden';document.addEventListener('wheel',guard,{passive:false});document.addEventListener('touchmove',guard,{passive:false});}
 locks.push(entry);let released=false;
 return()=>{if(released)return;released=true;const index=locks.indexOf(entry);if(index>=0)locks.splice(index,1);if(!locks.length){document.body.style.overflow=bodyOverflow;document.documentElement.style.overflow=rootOverflow;document.removeEventListener('wheel',guard);document.removeEventListener('touchmove',guard);window.scrollTo(x,y);}};
}
