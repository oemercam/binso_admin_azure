import ts from 'typescript';
function renderedLiterals(value){
 if(ts.isStringLiteral(value)||ts.isNoSubstitutionTemplateLiteral(value))return [value];
 if(ts.isConditionalExpression(value))return [...renderedLiterals(value.whenTrue),...renderedLiterals(value.whenFalse)];
 if(ts.isParenthesizedExpression(value))return renderedLiterals(value.expression);
 if(ts.isBinaryExpression(value)&&[ts.SyntaxKind.BarBarToken,ts.SyntaxKind.QuestionQuestionToken,ts.SyntaxKind.AmpersandAmpersandToken].includes(value.operatorToken.kind))return [...renderedLiterals(value.left),...renderedLiterals(value.right)];
 return [];
}
/** LocalizedElement translates native attributes, never its children. Literal
 * UI text needs an actual text boundary; dynamic record values remain verbatim. */
export function jsxCopyNodes(ast){
 const boundaries=new Set(['LocalizedText','Button','Status','Toast','LoadingState','ErrorState','EmptyState']),messages=[];
 const visit=node=>{
  const rendered=ts.isJsxText(node)?[node]:ts.isJsxExpression(node)&&node.expression&&(ts.isJsxElement(node.parent)||ts.isJsxFragment(node.parent))?renderedLiterals(node.expression):[];
  for(const literal of rendered){
   const text=literal.text.replace(/\s+/g,' ').trim();
   if(/[A-Za-zÀ-ž]{2}/.test(text)){
    let localized=false;
    for(let parent=node.parent;parent;parent=parent.parent)if(ts.isJsxElement(parent)&&boundaries.has(parent.openingElement.tagName.getText(ast))){localized=true;break;}
    messages.push({text,line:ast.getLineAndCharacterOfPosition(literal.getStart(ast)).line+1,localized});
   }
  }
  ts.forEachChild(node,visit);
 };
 visit(ast);return messages;
}
export function unlocalizedJsxText(ast){return jsxCopyNodes(ast).filter(row=>!row.localized).map(({localized:_localized,...row})=>row);}
/** Only deliberately public ApiError messages; internal Error diagnostics and
 * dynamic record content must not be copied into the translation catalogue. */
export function apiMessageLiterals(ast){
 const messages=[];
 const visit=node=>{
  if(ts.isNewExpression(node)&&node.expression.getText(ast)==='ApiError'){
   const value=node.arguments?.[2];
   if(value)for(const literal of renderedLiterals(value))messages.push({text:literal.text,line:ast.getLineAndCharacterOfPosition(literal.getStart(ast)).line+1});
  }
  ts.forEachChild(node,visit);
 };
 visit(ast);return messages;
}
/** Ignore translation boundaries when comparing the frozen navigation structure. */
export function withoutLocalization(source){
 const ast=ts.createSourceFile('source.tsx',source,99,true,4),edits=[];
 const visit=node=>{
  if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='LocalizedText'&&node.children.length===1&&ts.isJsxExpression(node.children[0])&&node.children[0].expression){
   const expression=node.children[0].expression;
   edits.push({start:node.getStart(ast),end:node.end,value:ts.isStringLiteral(expression)?expression.text:'{'+expression.getText(ast)+'}'});return;
  }
  if(ts.isJsxElement(node)||ts.isJsxSelfClosingElement(node)){
   const opening=ts.isJsxElement(node)?node.openingElement:node;
   if(opening.tagName.getText(ast)==='LocalizedElement'){
    const as=opening.attributes.properties.find(a=>ts.isJsxAttribute(a)&&a.name.getText(ast)==='as');
    if(as?.initializer&&ts.isStringLiteral(as.initializer)){
     edits.push({start:opening.tagName.getStart(ast),end:opening.tagName.end,value:as.initializer.text},{start:as.getFullStart(),end:as.end,value:''});
     if(ts.isJsxElement(node))edits.push({start:node.closingElement.tagName.getStart(ast),end:node.closingElement.tagName.end,value:as.initializer.text});
    }
   }
  }
  ts.forEachChild(node,visit);
 };visit(ast);for(const edit of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,edit.start)+edit.value+source.slice(edit.end);return source;
}
