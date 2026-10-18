import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),postcss=require(require.resolve('postcss',{paths:[require.resolve('next')]}));
export const designManifest=JSON.parse(fs.readFileSync('app/design-system/manifest.json','utf8'));
export const designSources=designManifest.sources.map(source=>source.path);
export const readDesignCss=()=>designSources.map(file=>fs.readFileSync(file,'utf8')).join('\n');
/** Origin labels preserve the historical digest only; they are not imports. */
export function navigationRules(read=file=>fs.readFileSync(file,'utf8')){
 const tree=postcss.parse(read('app/design-system/navigation.css'));let source='app/design-system/navigation.css';const entries=[];
 for(const node of tree.nodes){if(node.type==='comment'&&node.text.startsWith('Navigation contract source: ')){source=node.text.slice('Navigation contract source: '.length);continue;}
  if(node.type==='rule')entries.push({file:source,rule:node});
  else if(node.type==='atrule')node.walkRules(rule=>entries.push({file:source,rule}));
 }
 return entries;
}
