import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),postcss=require(require.resolve('postcss',{paths:[require.resolve('next')]}));
export function ruleContext(rule){const parts=[];for(let p=rule.parent;p&&p.type!=='root';p=p.parent){if(p.type!=='atrule'||/keyframes$/.test(p.name)||p.name==='layer'&&!p.params)return null;parts.unshift('@'+p.name+' '+p.params)}return parts.join('/');}
const portable=value=>!/(?:\d(?:dvh|dvw|svh|svw|lvh|lvw)|env\(|color-mix\(|light-dark\(|anchor\(|scroll\(|view\(|-webkit-|-moz-)/i.test(value)&&[...value.matchAll(/([\w-]+)\(/g)].every(m=>['var','calc','min','max','clamp','repeat','minmax','fit-content','rgb','rgba','hsl','hsla','url','linear-gradient','translate','translateX','translateY','translateZ','scale','rotate','cubic-bezier'].includes(m[1]));
/** Only remove an earlier declaration dominated by the exact selector/condition.
 * Nothing is moved; selector lists, priorities and feature fallbacks stay distinct.
 * Ordered values within a rule are deliberate progressive fallback, never folded. */
export function supersededDeclarations(root){
 const groups=new Map();root.walkRules(rule=>{const context=ruleContext(rule);if(context===null)return;const selector=rule.selectors.map(s=>s.trim()).join(',');
  for(const decl of rule.nodes.filter(n=>n.type==='decl')){const key=context+'|'+selector+'|'+decl.prop;const list=groups.get(key)??[];list.push(decl);groups.set(key,list)}
 });
 const result=[];for(const declarations of groups.values()){
  const last=declarations.at(-1);if(!portable(last.value)||declarations.some(d=>d.important!==last.important))continue;
  // A multi-value property in the final rule retains the preceding fallback too.
  if(declarations.filter(d=>d.parent===last.parent).length!==1)continue;
  for(const earlier of declarations.slice(0,-1))if(earlier.parent!==last.parent)result.push({earlier,last});
 }
 return result;
}
export function pruneSuperseded(root){const removed=supersededDeclarations(root).map(({earlier,last})=>({selector:earlier.parent.selector,condition:ruleContext(earlier.parent),property:earlier.prop,old:earlier.value,current:last.value,line:earlier.source.start.line,winner:last.source.start.line}));for(const {earlier} of supersededDeclarations(root))earlier.remove();root.walkRules(rule=>{if(!rule.nodes.some(n=>n.type!=='comment'))rule.remove()});root.walkAtRules(rule=>{if(rule.nodes&&!rule.nodes.length)rule.remove()});return removed;}
export function parseCss(source){return postcss.parse(source)}
