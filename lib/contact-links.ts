/** Encode record text as a fixed-protocol contact URI, never as markup or URI options. */
export function contactHref(kind:'email'|'phone',value:string):string|undefined{
 const text=value.trim();
 if(!text||/[\u0000-\u001f\u007f]/.test(text))return;
 if(kind==='email'){
  if(!/^[^@\s]+@[^@\s]+$/.test(text))return;
  return 'mailto:'+encodeURIComponent(text).replaceAll('%40','@');
 }
 const number=text.replace(/[ ()./-]/g,'');
 if(!/^\+?\d{3,15}$/.test(number))return;
 return 'tel:'+(number.startsWith('+')?'+':'')+encodeURIComponent(number.replace(/^\+/,''));
}
