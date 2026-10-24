export type DevicePushSubscription={endpoint:string;keys:{p256dh:string;auth:string}};
/** Only known browser push services, never arbitrary user-supplied fetch destinations. */
export function validPushSubscription(value:unknown):value is DevicePushSubscription{
 if(!value||typeof value!=='object')return false;const s=value as DevicePushSubscription;
 if(typeof s.endpoint!=='string'||s.endpoint.length>4096||!s.keys||typeof s.keys.p256dh!=='string'||typeof s.keys.auth!=='string')return false;
 try{const u=new URL(s.endpoint);if(u.protocol!=='https:'||u.port&&u.port!=='443'||u.username||u.password||u.hash)return false;
 const host=u.hostname;const known=host==='fcm.googleapis.com'&&(u.pathname.startsWith('/fcm/send/')||u.pathname.startsWith('/wp/'))||host==='updates.push.services.mozilla.com'&&u.pathname.startsWith('/wpush/v2/')||host==='web.push.apple.com'&&u.pathname.length>1||/^[a-z0-9-]+\.notify\.windows\.com$/.test(host)&&u.pathname==='/w/';
 return known&&/^[A-Za-z0-9_-]{87}=?$/.test(s.keys.p256dh)&&/^[A-Za-z0-9_-]{22}={0,2}$/.test(s.keys.auth);
 }catch{return false}
}
export function pushPreference(kind:string,href:string|null){if(kind==='support')return 'Support';if(kind==='approval')return href?.startsWith('/spesen')?'Spesen':'Zeiterfassung';if(kind==='billing')return 'Rechnungen';if(kind==='account')return 'Sicherheit';if(href?.startsWith('/angebote'))return 'Angebote';return 'Produktupdates'}
