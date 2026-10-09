/** Redundant copies differ from deliberate ordered values/progressive fallbacks. */
export function redundantDeclarations(root){
 const redundant=[],last=new Map();root.walkRules(rule=>{
  // Navigation chrome is immutable in this work package, including old cascade.
  if(/nav|sidebar|app-root|app-main|mobile-header|desktop-appbar/.test(rule.selector))return;
  let context='';for(let p=rule.parent;p&&p.type!=='root';p=p.parent){if(p.type==='atrule'){if(p.name.endsWith('keyframes'))return;context=p.name+' '+p.params+'/'+context;}}
  for(const decl of rule.nodes.filter(n=>n.type==='decl')){
   const key=context+'|'+rule.selector+'|'+decl.prop,previous=last.get(key);
   if(previous&&previous.value===decl.value&&previous.important===decl.important)redundant.push({selector:rule.selector,context,property:decl.prop,value:decl.value,earlier:previous.source.start.line,later:decl.source.start.line});
   last.set(key,decl);
  }
 });return redundant;
}
