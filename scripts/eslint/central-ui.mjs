import path from 'node:path';
// Deliberate native controls live only inside their canonical renderer.
const nativeOwners={
 'components/ui.tsx':{input:['Input'],select:['Select'],textarea:['Textarea']},
 'components/binso-ux.tsx':{input:['ListSearch']},
 'components/header-panel-content.tsx':{input:['SearchPanel']},
 'components/records.tsx':{select:['RecordsView']}, // collapsed native sort picker
 'components/privacy-consent.tsx':{input:['PrivacyConsent']}, // consent toggle, outside tenant forms
};
const classOwners={
 'app-header':['components/app-chrome.tsx'],
 'app-header-actions':['components/app-chrome.tsx'],
 'mobile-dock':['components/app-chrome.tsx'],
 'form-wizard':['components/form-wizard.tsx'],
 'wizard-progress':['components/form-wizard.tsx'],
 'wizard-content':['components/form-wizard.tsx'],
 'form-field':['components/ui.tsx'],
 'message':['components/ui.tsx'],
 'confirm-dialog':['components/confirm-dialog.tsx'],
 'confirm-layer':['components/confirm-dialog.tsx'],
 'bottom-sheet':['components/binso-ux.tsx'],
 'sheet-layer':['components/binso-ux.tsx'],
 'bo-page-heading':['components/binso-ux.tsx'],
 'bo-detail-heading':['components/binso-ux.tsx'],
 'desktop-record-table':['components/records.tsx'],
 'operator-table':['components/records.tsx'],
 'document-page-viewer':['components/pdf-preview.tsx'],
};
function owner(node){for(let p=node.parent;p;p=p.parent){if(p.type==='FunctionDeclaration')return p.id?.name;if(['ArrowFunctionExpression','FunctionExpression'].includes(p.type)&&p.parent?.type==='VariableDeclarator')return p.parent.id?.name;}return null;}
function classStrings(node){if(!node)return [];if(node.type==='Literal'&&typeof node.value==='string')return [node.value];if(node.type==='JSXExpressionContainer')return classStrings(node.expression);if(node.type==='TemplateLiteral')return [...node.quasis.map(q=>q.value.cooked??q.value.raw),...node.expressions.flatMap(classStrings)];if(node.type==='ConditionalExpression')return [...classStrings(node.consequent),...classStrings(node.alternate)];if(node.type==='LogicalExpression')return [...classStrings(node.left),...classStrings(node.right)];return [];}
function literal(attribute){const value=attribute?.value;if(value?.type==='Literal')return value.value;if(value?.type==='JSXExpressionContainer'&&value.expression.type==='Literal')return value.expression.value;return undefined;}
const rule={
 meta:{type:'problem',schema:[],messages:{native:'Use the existing {{control}} from components/ui; native controls belong to the canonical renderer.',owned:'{{name}} belongs to its central component. Reuse it instead of creating another native wrapper.',barrel:'Import the actual domain module; app-pages is a retired compatibility import.',state:'Use the central {{component}} from components/ui for this state.',style:'Visual styling belongs to the central CSS owner. Inline styles may only supply measured CSS custom properties.',stylesheet:'Runtime CSS belongs to app/binso-ui.css and its design-system manifest; do not create a page-local stylesheet.'}},
 create(context){const file=path.relative(process.cwd(),context.filename).replaceAll('\\','/');return {
  ImportDeclaration(node){if(/(?:^|\/)app-pages$/.test(node.source.value))context.report({node,messageId:'barrel'});if(/\.(css|scss|sass)$/.test(node.source.value)&&!(['app/layout.tsx','app/global-error.tsx'].includes(file)&&node.source.value==='./binso-ui.css'))context.report({node,messageId:'stylesheet'});},
  JSXOpeningElement(node){if(node.name.type!=='JSXIdentifier')return;let tag=node.name.name;
   if(tag==='style')context.report({node,messageId:'stylesheet'});
   const inline=node.attributes.find(a=>a.type==='JSXAttribute'&&a.name.name==='style');
   if(inline&&file!=='app/opengraph-image.tsx'){
    let value=inline.value?.expression;while(value?.type==='TSAsExpression'||value?.type==='TSSatisfiesExpression')value=value.expression;
    const variables=value?.type==='ObjectExpression'&&value.properties.every(p=>p.type==='Property'&&String(p.key.value??p.key.name??'').startsWith('--'));
    const tableTracks=file==='components/records.tsx'&&value?.type==='CallExpression'&&value.callee.name==='recordGrid';
    if(!variables&&!tableTracks)context.report({node:inline,messageId:'style'});
   }
   if(tag==='LocalizedElement'){const as=node.attributes.find(a=>a.type==='JSXAttribute'&&a.name.name==='as');tag=literal(as)??tag;}
   if(['input','select','textarea'].includes(tag)&&!nativeOwners[file]?.[tag]?.includes(owner(node)))context.report({node,messageId:'native',data:{control:{input:'Input',select:'Select',textarea:'Textarea'}[tag]}});
   if(!/^[a-z]/.test(tag))return;
   const attributes=node.attributes.filter(a=>a.type==='JSXAttribute'),classes=classStrings(attributes.find(a=>a.name.name==='className')?.value);
   for(const cls of classes)for(const name of cls.split(/\s+/))if(classOwners[name]&&!classOwners[name].includes(file))context.report({node,messageId:'owned',data:{name}});
   const role=literal(attributes.find(a=>a.name.name==='role'));
   if(file!=='components/ui.tsx'&&tag==='p'&&role==='alert')context.report({node,messageId:'state',data:{component:'ErrorState'}});
   if(file!=='components/ui.tsx'&&tag==='p'&&role==='status'&&node.parent?.children?.some(c=>c.type==='JSXText'&&/geladen|wird angezeigt|suche läuft/i.test(c.value)))context.report({node,messageId:'state',data:{component:'LoadingState'}});
  },
 };},
};
const plugin={rules:{'central-components':rule}};
export default plugin;
export {nativeOwners,classOwners};
