import assert from 'node:assert/strict';
import {assertRowPresentation} from './row-presentation-contract.mjs';
const box=(x,y,width,height)=>({x,y,width,height,right:x+width,bottom:y+height});
const document={title:box(0,0,100,17),meta:box(0,22,100,15),amount:box(120,21,80,17),status:box(120,-1.5,80,20),metadataAmount:true,information:false,amountFits:true,control:null};
assertRowPresentation(document,'approved two-line document');
for(const broken of [
 {...document,amount:box(120,0,80,17)},
 {...document,amount:box(120,45,80,17)},
 {...document,amount:box(90,21,80,17)},
 {...document,amountFits:false},
 {...document,status:null},
 {...document,status:box(90,-1.5,80,20)},
])assert.throws(()=>assertRowPresentation(broken));
const information={...document,information:true,height:46,metaHidden:true,title:box(0,15,100,16),amount:box(120,15,80,16)};
assertRowPresentation(information,'approved compact information row');
for(const broken of [{...information,height:64},{...information,metaHidden:false},{...information,amount:box(120,32,80,16)},{...information,control:box(120,1,24,44)}])assert.throws(()=>assertRowPresentation(broken));
assertRowPresentation({...document,metadataAmount:false,amount:box(120,0,80,17)},'existing separate-value row');
console.log('Row presentation: explicit two-line documents and compact information rows; wrong line, third line, overlap, clipping, hidden status and undersized controls rejected.');
