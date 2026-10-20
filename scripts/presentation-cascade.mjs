import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),postcss=require(require.resolve('postcss',{paths:[require.resolve('next')]}));
export function ruleContext(rule){const parts=[];for(let p=rule.parent;p&&p.type!=='root';p=p.parent){if(p.type!=='atrule'||/keyframes$/.test(p.name)||p.name==='layer'&&!p.params)return null;parts.unshift('@'+p.name+' '+p.params)}return parts.join('/');}
const portable=value=>!/(?:\d(?:dvh|dvw|svh|svw|lvh|lvw)|env\(|color-mix\(|light-dark\(|anchor\(|scroll\(|view\(|-webkit-|-moz-)/i.test(value)&&[...value.matchAll(/([\w-]+)\(/g)].every(m=>['var','calc','min','max','clamp','repeat','minmax','fit-content','rgb','rgba','hsl','hsla','url','linear-gradient','translate','translateX','translateY','translateZ','scale','rotate','cubic-bezier'].includes(m[1]));
/** Only remove an earlier declaration dominated by the same selectors/condition.
 * Nothing is moved; selector lists, priorities and feature fallbacks stay distinct.
 * Ordered values within a rule are deliberate progressive fallback, never folded. */
export function supersededDeclarations(root){
 const groups=new Map();root.walkRules(rule=>{const context=ruleContext(rule);if(context===null)return;
  for(const decl of rule.nodes.filter(n=>n.type==='decl')){const key=context+'|'+decl.prop;const list=groups.get(key)??[];list.push(decl);groups.set(key,list)}
 });
 const result=[];for(const declarations of groups.values()){
  for(let i=0;i<declarations.length;i++){
   const earlier=declarations[i],selectors=earlier.parent.selectors.map(s=>s.trim());
   const last=declarations.slice(i+1).findLast(candidate=>{
    if(candidate.parent===earlier.parent||candidate.important!==earlier.important||!portable(candidate.value))return false;
    if(declarations.filter(d=>d.parent===candidate.parent).length!==1)return false;
    const later=candidate.parent.selectors.map(s=>s.trim());
    // A selector-list superset is safe only when extra selectors cannot invalidate
    // the whole rule on an older supported browser. Never fold partial overlap.
    return selectors.every(s=>later.includes(s))&&later.filter(s=>!selectors.includes(s)).every(s=>/^[.#\w\s>+~-]+$/.test(s));
   });
   if(last)result.push({earlier,last});
  }
 }
 return result;
}
export function pruneSuperseded(root){const removed=supersededDeclarations(root).map(({earlier,last})=>({selector:earlier.parent.selector,condition:ruleContext(earlier.parent),property:earlier.prop,old:earlier.value,current:last.value,line:earlier.source.start.line,winner:last.source.start.line}));for(const {earlier} of supersededDeclarations(root))earlier.remove();root.walkRules(rule=>{if(!rule.nodes.some(n=>n.type!=='comment'))rule.remove()});root.walkAtRules(rule=>{if(rule.nodes&&!rule.nodes.length)rule.remove()});return removed;}
export function parseCss(source){return postcss.parse(source)}
