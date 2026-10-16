import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),postcss=require(require.resolve('postcss',{paths:[require.resolve('next')]}));
export const navigationContract=JSON.parse(fs.readFileSync('ux-compliance/navigation-contract.v3.json','utf8'));
export function navigationErrors(css){
 const tree=postcss.parse(css),errors=[];
 const values=(selector,property)=>{const result=[];tree.walkRules(selector,rule=>{if(rule.parent.type==='atrule'&&rule.parent.params==='(forced-colors:active)')return;rule.walkDecls(property,d=>result.push(d.value))});return result};
 const exact=(selector,property,value)=>{const actual=values(selector,property);if(actual.length!==1||actual[0]!==value)errors.push(selector+': '+property+' must be '+value)};
 exact('.mobile-dock','inset','auto 0 0');
 exact('.mobile-dock','background','var(--color-bg)');
 exact('.mobile-dock> :is(.bottom-nav,.operator-mobile-nav)','height','var(--mobile-nav-h)');
 exact('.mobile-dock> :is(.bottom-nav,.operator-mobile-nav)','background','var(--color-bg)');
 exact(':is(.bottom-nav,.operator-mobile-nav)>:is(a,button).active','color','var(--app-accent)');
 exact(':is(.bottom-nav,.operator-mobile-nav)>:is(a,button)','min-height','44px');
 exact(':is(.bottom-nav,.operator-mobile-nav)>:is(a,button)','border-radius','0');
 if(!tree.nodes.some(n=>n.type==='atrule'&&n.params==='(max-width:1023px)'))errors.push('Mobile navigation ends at 1023px');
 tree.walkDecls(d=>{if(/backdrop-filter|box-shadow/.test(d.prop)&&d.value!=='none')errors.push('Glass/shadow forbidden');if(d.prop==='border-radius'&&!/^0(px)?$/.test(d.value))errors.push('Floating rounded bar forbidden')});
 if(/is-compact|app-glass/.test(css))errors.push('No shrinking glass navigation');
 return errors;
}
