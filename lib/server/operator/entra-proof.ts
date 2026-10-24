type Claim={typ?:unknown;val?:unknown};
/** EasyAuth validates the Entra token and strips client-supplied identity headers.
 * Only an explicit multifactor method proves MFA; a role, device, OTP, password
 * or arbitrary authentication-context ID does not prove an MFA policy. */
export function hasEntraMfaProof(claims:readonly Claim[]){
 const names=new Set(['amr','http://schemas.microsoft.com/claims/authnmethodsreferences']);
 return claims.some(claim=>{
  if(typeof claim.typ!=='string'||!names.has(claim.typ.toLowerCase())||typeof claim.val!=='string')return false;
  let methods:unknown=claim.val;
  if(claim.val.startsWith('[')){try{methods=JSON.parse(claim.val)}catch{return false}}
  const values=Array.isArray(methods)?methods:[methods];
  return values.some(value=>value==='mfa'||value==='ngcmfa');
 });
}
