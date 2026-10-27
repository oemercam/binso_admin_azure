'use client';
import {browserSupportsWebAuthn,startAuthentication,type PublicKeyCredentialRequestOptionsJSON} from '@simplewebauthn/browser';
import {apiReadPost} from './backend';
export function supportsPasskeys(){return typeof window!=='undefined'&&window.isSecureContext&&browserSupportsWebAuthn();}
export function passkeyError(error:unknown){
 const name=error instanceof Error?error.name:'';
 if(name==='NotAllowedError'||name==='AbortError'||error instanceof Error&&/ERROR_CEREMONY_ABORTED|ERROR_PASSTHROUGH_SEE_CAUSE/.test(String((error as {code?:string}).code)))return 'Die Passkey-Anmeldung wurde abgebrochen oder ist abgelaufen. Versuche es erneut oder melde dich mit Passwort an.';
 if(name==='InvalidStateError')return 'Dieser Passkey ist bereits eingerichtet. Verwende einen anderen Authenticator.';
 if(name==='NotSupportedError'||name==='SecurityError')return 'Passkeys werden hier nicht unterstützt. Bitte mit Passwort anmelden.';
 return error instanceof Error?error.message:'Anmeldung nicht möglich.';
}
export async function confirmWithPasskey(){
 const options=await apiReadPost<PublicKeyCredentialRequestOptionsJSON>('/api/auth/passkeys/options',{mode:'reauthenticate'});
 const response=await startAuthentication({optionsJSON:options});
 return apiReadPost<{ok:boolean}>('/api/auth/passkeys/verify',{mode:'reauthenticate',response});
}
