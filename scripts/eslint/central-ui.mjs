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
 'form-field':['components/ui.tsx'],
 'message':['components/ui.tsx'],
 'confirm-dialog':['components/confirm-dialog.tsx'],
 'confirm-layer':['components/confirm-dialog.tsx'],
 'bottom-sheet':['components/binso-ux.tsx','components/app-shell.tsx'], // protected navigation sheets
 'sheet-layer':['components/binso-ux.tsx','components/app-shell.tsx'],
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
 meta:{type:'problem',schema:[],messages:{native:'Use the existing {{control}} from components/ui; native controls belong to the canonical renderer.',owned:'{{name}} belongs to its central component. Reuse it instead of creating another native wrapper.',barrel:'Import the actual domain module; app-pages is a retired compatibility import.',state:'Use the central {{component}} from components/ui for this state.'}},
 create(context){const file=path.relative(process.cwd(),context.filename).replaceAll('\\','/');return {
  ImportDeclaration(node){if(/(?:^|\/)app-pages$/.test(node.source.value))context.report({node,messageId:'barrel'});},
  JSXOpeningElement(node){if(node.name.type!=='JSXIdentifier')return;const tag=node.name.name;
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
