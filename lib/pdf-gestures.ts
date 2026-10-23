export function boundPdfZoom(value:number){return Number.isFinite(value)?Math.min(4,Math.max(1,value)):1;}
export function pdfSwipePage(page:number,total:number,dx:number,dy:number,zoom:number,multiTouch:boolean){
 if(zoom>1.01||multiTouch||Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.5)return page;
 return Math.min(total,Math.max(1,page+(dx<0?1:-1)));
}
