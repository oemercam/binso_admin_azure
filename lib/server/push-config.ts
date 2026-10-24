import 'server-only';
import {createECDH,timingSafeEqual} from 'node:crypto';
import {env} from './env';

/** Validate runtime settings without contacting a provider or generating persistent keys. */
export function pushConfiguration(){
 const publicKey=process.env.WEB_PUSH_PUBLIC_KEY?.trim();
 const privateKey=process.env.WEB_PUSH_PRIVATE_KEY?.trim();
 const subject=process.env.WEB_PUSH_SUBJECT?.trim();
 let reason:'ready'|'missing_configuration'|'invalid_configuration'='missing_configuration';
 if(publicKey&&privateKey&&subject&&env.appEncryptionKey){
  reason='invalid_configuration';
  try{
   if(!/^[A-Za-z0-9_-]{87}=?$/.test(publicKey)||!/^[A-Za-z0-9_-]{43}=?$/.test(privateKey)||!/^mailto:[^\s@]+@[^\s@]+$/.test(subject))throw Error('invalid');
   const publicBytes=Buffer.from(publicKey,'base64url'),privateBytes=Buffer.from(privateKey,'base64url');
   const curve=createECDH('prime256v1');curve.setPrivateKey(privateBytes);
   if(publicBytes.length!==65||privateBytes.length!==32||!timingSafeEqual(publicBytes,curve.getPublicKey()))throw Error('invalid');
   reason='ready';
  }catch{/* Never include keys or crypto exceptions in logs or API responses. */}
 }
 const enabled=reason==='ready';
 return {enabled,reason,publicKey:enabled?publicKey:null,privateKey:enabled?privateKey:undefined,subject:enabled?subject:undefined};
}

export function pushWorkerConfiguration(){
 const requested=process.env.WEB_PUSH_WORKER_ENABLED==='true';
 const value=Number(process.env.WEB_PUSH_INTERVAL_SECONDS??'60');
 const intervalSeconds=Number.isInteger(value)&&value>=30&&value<=900?value:60;
 return {requested,intervalSeconds,enabled:requested&&!!env.databaseUrl&&pushConfiguration().enabled};
}
