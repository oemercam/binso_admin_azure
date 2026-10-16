import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as icons from 'lucide-react';

/** Read trusted, versioned owner references with bundled icons; no product HTML path. */
export async function referenceDocument(name){
 if(!['desktop-login','landingpage','mobile-app','komponenten'].includes(name))throw Error('Unknown approved reference');
 let html=await fs.readFile('docs/audit/v24/reference/'+name+'.html','utf8');
 html=html.replace(/<i\b([^>]*?)data-lucide="([^"]+)"([^>]*)><\/i>/g,(_match,before,name,after)=>{
    const key=name.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(''),Icon=icons[key]??icons.File;
    return renderToStaticMarkup(createElement(Icon,{'aria-hidden':true})).replace('<svg ','<svg '+before+' '+after+' ');
   });
 return html;
}

/** Owner-supplied references are evidence, never a replacement screenshot baseline.
 * Render with bundled Lucide; isolated context denies all remote requests. */
export async function captureReferenceViews(browser,output){
 const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light'});
 await context.route('**/*',route=>route.abort());
 const page=await context.newPage();
 const destination=path.join(output,'approved-reference');await fs.mkdir(destination,{recursive:true});
 try{
  for(const name of ['desktop-login','landingpage','mobile-app','komponenten']){
   // These versioned owner references intentionally retain their own interactions.
   // Remote resources are denied by the isolated context, not regex-sanitized.
   const html=await referenceDocument(name);
   await page.setContent(html,{waitUntil:'load'});
   await page.evaluate(()=>document.fonts.ready);
   if(name==='desktop-login'){
    await page.screenshot({path:path.join(destination,'desktop-login-1440.png'),fullPage:true});
    await page.locator('[data-portal="app"]').click();
    await page.screenshot({path:path.join(destination,'desktop-customer-detail-1440.png'),fullPage:true});
    await page.locator('#bm-back').click();
    await page.screenshot({path:path.join(destination,'desktop-customers-1440.png'),fullPage:true});
   }else if(name==='mobile-app'){
    await page.screenshot({path:path.join(destination,name+'-1440.png'),fullPage:true});
    await page.locator('#ba-pages').selectOption('customers');
    await page.screenshot({path:path.join(destination,'mobile-customers-1440.png'),fullPage:true});
    await page.locator('[data-customer]').first().click();
    await page.screenshot({path:path.join(destination,'mobile-customer-detail-1440.png'),fullPage:true});
   }else await page.screenshot({path:path.join(destination,name+'-1440.png'),fullPage:true});
  }
 }finally{await context.close()}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
 const browser=await engines.chromium.launch({headless:true});
 try{await captureReferenceViews(browser,process.env.BINSO_REFERENCE_OUTPUT??'/tmp/binso-ux-references')}finally{await browser.close()}
}
