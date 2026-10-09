// Optional read-only DOM/cascade evidence. Fixtures and production writes stay separate.
export async function captureUxDom(page,route){
 return page.evaluate(route=>{
  const selectors='header,.metrics-grid,.metric,.metric-top,.document-summary-row,.document-summary-amount,.contact-list>div,.contact-main,.contact-actions,.tabs,.toolbar,.chips,.time-group,.time-group-title,.form-field,.form-actions,.sheet-header,.sheet-body,.filter-sheet-actions,.pdf-pages,.pdf-page,.pdf-page-navigation,input,select,textarea';
  const properties=['display','position','grid-template-columns','grid-template-rows','grid-auto-rows','align-items','align-content','justify-content','justify-self','text-align','min-width','min-height','width','height','padding','margin','gap','overflow-x','overflow-y','font-size','line-height','z-index','opacity','filter','background-color'];
  const rules=[];
  const visit=(list,sheet,contexts=[])=>{for(const rule of list){
   if(rule.media&&!matchMedia(rule.conditionText).matches)continue;
   if(rule.constructor.name==='CSSSupportsRule'&&!CSS.supports(rule.conditionText))continue;
   if(rule.selectorText)rules.push({sheet,selector:rule.selectorText,context:contexts,declarations:rule.style.cssText});
   else if(rule.cssRules)visit(rule.cssRules,sheet,[...contexts,rule.conditionText??rule.cssText.split('{')[0]]);
  }};
  for(const sheet of document.styleSheets){try{visit(sheet.cssRules,sheet.href??'inline')}catch{/* Cross-origin styles are explicitly excluded. */}}
  return {route,url:location.pathname,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,theme:document.documentElement.dataset.theme,
   nodes:[...document.querySelectorAll(selectors)].filter(el=>el.getClientRects().length).map(el=>{
    const style=getComputedStyle(el),rect=el.getBoundingClientRect();return {tag:el.tagName,classes:el.className,text:el.textContent?.trim().slice(0,150),inline:el.getAttribute('style'),parent:el.parentElement?.className,box:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},computed:Object.fromEntries(properties.map(p=>[p,style.getPropertyValue(p)])),matchedRules:rules.filter(rule=>{try{return el.matches(rule.selector)}catch{return false}})};
   }),notes:['Matched rules are cascade candidates; computed values are resolved browser results. Conditional media/support rules are evaluated in this viewport. Inherited parent classes and inline declarations retained. This is not an assertion that every matched declaration wins.']};
 },route);
}
