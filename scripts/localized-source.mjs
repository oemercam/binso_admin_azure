import ts from 'typescript';
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
