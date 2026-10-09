/** Compare displayed list values using their date/amount meaning. */
export function compareRecordValues(left:string|number,right:string|number):number {
  if(typeof left==='number'&&typeof right==='number')return left-right;
  const date=(value:string|number)=>{
    const text=String(value);
    const iso=text.match(/^\d{4}-\d{2}-\d{2}(?:T.*)?$/);
    if(iso){const timestamp=Date.parse(text);return Number.isFinite(timestamp)?timestamp:null;}
    const swiss=text.match(/\b(\d{2})\.(\d{2})\.(\d{4})(?:,?\s+(\d{2}):(\d{2}))?/);
    return swiss?Date.UTC(Number(swiss[3]),Number(swiss[2])-1,Number(swiss[1]),Number(swiss[4]??0),Number(swiss[5]??0)):null;
  };
  const a=date(left),b=date(right);
  if(a!==null&&b!==null)return a-b;
  const numeric=(value:string|number)=>{
    const text=String(value).replace(/^[A-Z]{3}\s*/, '').replace(/\s+\/\s+[^\d]+$/, '').replace(/['’\s%]/g,'').replace(',','.');
    return /^-?\d+(?:\.\d+)?$/.test(text)?Number(text):null;
  };
  const x=numeric(left),y=numeric(right);
  if(x!==null&&y!==null)return x-y;
  return String(left).localeCompare(String(right),'de-CH',{numeric:true,sensitivity:'base'});
}
