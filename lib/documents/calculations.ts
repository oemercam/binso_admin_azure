export type DocumentPosition={description:string;quantity:number;unitPrice:number;vatRate:number};

export function calculateDocumentTotals(positions:DocumentPosition[],discountPercent=0){
 const baseNet=positions.reduce((sum,p)=>sum+p.quantity*p.unitPrice,0);
 const factor=Math.max(0,1-discountPercent/100);
 const net=baseNet*factor;
 const vat=positions.reduce((sum,p)=>sum+p.quantity*p.unitPrice*p.vatRate/100,0)*factor;
 return {baseNet,net,vat,gross:net+vat};
}
