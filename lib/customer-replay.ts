/** Retain the old request key when a recovered draft only gained the company default.
 * The server must resolve/conflict on that key; never allocate a new customer silently.
 * Actual user edits and a switch to a private customer remain different requests. */
export function sameCustomerCreation(previous:string,current:string):boolean{
 if(previous===current)return true;
 try{
  const before=JSON.parse(previous),after=JSON.parse(current);
  if(!before||Array.isArray(before)||typeof before!=="object"||!after||Array.isArray(after)||typeof after!=="object")return false;
  if(Object.hasOwn(before,"customerType")||after.customerType!=="company")return false;
  delete after.customerType;
  const keys=Object.keys(before);
  return keys.length===Object.keys(after).length&&keys.every(key=>Object.hasOwn(after,key)&&before[key]===after[key]);
 }catch{return false;}
}
