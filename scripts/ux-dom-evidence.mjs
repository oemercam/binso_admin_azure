import fs from 'node:fs/promises';

/** Read the rendered CSSOM, including inactive media and overridden candidates. */
export async function saveDomEvidence(page, filename) {
 const evidence=await page.evaluate(()=>{
  const properties=['display','position','width','min-width','max-width','height','min-height','padding','border-radius','border-width','margin','gap','flex','grid','grid-template-columns','grid-template-rows','align-items','align-content','justify-content','text-align','font-size','font-weight','line-height','overflow','overflow-x','overflow-y','z-index','transform','opacity','backdrop-filter','background-color','white-space'];
  const selectors=['.mobile-back','.mobile-back svg','.detail-list>div','.detail-list dt','.detail-list dd','.settings-readonly .section-title','.page-container','.mobile-header','.bo-detail-heading','.tabs','.desktop-detail-main','.customer-tab-panel','.bo-metric-tiles','.metric','.contact-list>div','.contact-main','.document-summary-row','.document-summary-amount','.sheet-header','.sheet-body','.filter-sheet-actions','.document-modal','.document-modal-body','.document-page-viewer','.pdf-page','.document-page-navigation'];
  selectors.push('.account-sheet-profile','.account-sheet-profile>div','.header-panel-layer','.header-panel','.header-panel-heading','.header-search-controls','.search-results','.person-avatar','.preference-row','.preference-channels','.form-wizard','.wizard-progress','.wizard-content','.wizard-fields','.form-actions','.action-row','.action-row>span','.sheet-menu>a','.sheet-menu>button','.form-field','.form-field>span','.form-field>input','.form-field>select','.mobile-sticky-save','.record-controls');
  const rules=[];
  const walk=(list,source,contexts=[],active=true)=>{for(const [index,rule] of [...list].entries()){if(rule.type===CSSRule.IMPORT_RULE){try{walk(rule.styleSheet.cssRules,rule.href,contexts,active)}catch{}}else if(rule.type===CSSRule.STYLE_RULE)rules.push({source,index,order:rules.length,selector:rule.selectorText,css:rule.style.cssText,contexts,active});else if(rule.cssRules){const media=rule instanceof CSSMediaRule?rule.conditionText:null;const supports=rule instanceof CSSSupportsRule?rule.conditionText:null;walk(rule.cssRules,source,[...contexts,...(media?['media '+media]:supports?['supports '+supports]:[])],active&&(!media||matchMedia(media).matches)&&(!supports||CSS.supports(supports)));}}};
  for(const sheet of document.styleSheets){try{walk(sheet.cssRules,sheet.href??'inline')}catch{}}
  return {url:location.href,viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,elements:selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(el=>el.getClientRects().length).slice(0,8).map(el=>{
   const computed=getComputedStyle(el),rect=el.getBoundingClientRect();
   return {selector,tag:el.tagName,classes:el.className,text:el.textContent?.slice(0,200),inline:el.getAttribute('style'),rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},computed:Object.fromEntries(properties.map(p=>[p,computed.getPropertyValue(p)])),matchedRules:rules.filter(rule=>{try{return el.matches(rule.selector)}catch{return false}})};
  }))};
 });
 await fs.writeFile(filename,JSON.stringify(evidence,null,2)+'\n');
}
