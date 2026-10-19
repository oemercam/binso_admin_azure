/** Popup geometry uses actual content and the visible viewport, including an open keyboard. */
export function selectGeometry(rect:{left:number;top:number;bottom:number;width:number},viewport:{left:number;top:number;width:number;height:number},contentHeight:number){
 const edge=12,gap=4,right=viewport.left+viewport.width-edge,bottom=viewport.top+viewport.height-edge;
 const width=Math.max(0,Math.min(rect.width,viewport.width-edge*2));
 const left=Math.max(viewport.left+edge,Math.min(rect.left,right-width));
 const below=Math.max(0,bottom-Math.max(rect.bottom,viewport.top+edge)-gap),above=Math.max(0,Math.min(rect.top,bottom)-viewport.top-edge-gap);
 const wanted=Math.min(320,Math.max(0,contentHeight));
 const down=below>=Math.min(wanted,above),height=Math.min(wanted,down?below:above);
 const top=Math.max(viewport.top+edge,Math.min(down?rect.bottom+gap:rect.top-height-gap,bottom-height));
 return {left,top,width,height};
}
