/** Display-only legacy formatting; internal identifiers and stored references are unchanged. */
export function supportReference(id:string,caseNumber?:string|null){
  const raw=String(caseNumber??id).replace(/^#/,"");
  const demo=raw.match(/^DEMO-(\d+)(?:-|$)/i);
  if(demo)return "SUP-DEMO-"+demo[1].padStart(4,"0");
  if(/^(?:T-)?[0-9a-f-]{20,}$/i.test(raw))return "SUP-"+id.replace(/-/g,"").slice(0,8).toUpperCase();
  return raw;
}

