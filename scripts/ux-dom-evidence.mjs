import fs from 'node:fs/promises';

/** Read the rendered CSSOM, including inactive media and overridden candidates. */
export async function saveDomEvidence(page, filename) {
 const evidence=await page.evaluate(()=>{
  const properties=['display','position','height','min-height','padding','margin','gap','grid-template-columns','grid-template-rows','align-items','align-content','overflow-x','overflow-y','background-color','font-size','white-space'];
  const selectors=['.page-container','.mobile-header','.bo-detail-heading','.tabs','.desktop-detail-main','.customer-tab-panel','.bo-metric-tiles','.metric','.contact-list>div','.contact-main','.document-summary-row','.document-summary-amount','.sheet-header','.sheet-body','.filter-sheet-actions','.document-modal','.document-modal-body','.document-page-viewer','.pdf-page','.document-page-navigation'];
  const rules=[];
  const walk=(list,contexts=[],active=true)=>{for(const rule of list){if(rule.type===CSSRule.IMPORT_RULE){try{walk(rule.styleSheet.cssRules,contexts,active)}catch{}}else if(rule.type===CSSRule.STYLE_RULE)rules.push({selector:rule.selectorText,css:rule.style.cssText,contexts,active});else if(rule.cssRules){const media=rule instanceof CSSMediaRule?rule.conditionText:null;walk(rule.cssRules,media?[...contexts,media]:contexts,active&&(!media||matchMedia(media).matches));}}};
  for(const sheet of document.styleSheets){try{walk(sheet.cssRules)}catch{}}
  return {url:location.href,viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,elements:selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(el=>el.getClientRects().length).slice(0,8).map(el=>{
   const computed=getComputedStyle(el),rect=el.getBoundingClientRect();
   return {selector,tag:el.tagName,classes:el.className,text:el.textContent?.slice(0,200),inline:el.getAttribute('style'),rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},computed:Object.fromEntries(properties.map(p=>[p,computed.getPropertyValue(p)])),matchedRules:rules.filter(rule=>{try{return el.matches(rule.selector)}catch{return false}})};
  }))};
 });
 await fs.writeFile(filename,JSON.stringify(evidence,null,2)+'\n');
}
