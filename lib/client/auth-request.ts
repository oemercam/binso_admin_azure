/** Auth mutations are never automatically retried: their first response may be lost. */
export async function authRequest(path:string,options:RequestInit={}){
 if(!path.startsWith('/api/auth/')||path.includes('\\'))throw new Error('Ungültiger Anmeldepfad.');
 try{return await fetch(path,{...options,signal:options.signal??AbortSignal.timeout(15000)});}
 catch(error){
  const timeout=error instanceof DOMException&&['TimeoutError','AbortError'].includes(error.name);
  throw new Error(timeout?'Die Anfrage dauert zu lange. Bitte den gespeicherten Stand vor einer Wiederholung prüfen.':'Keine Verbindung zum Server. Bitte die Verbindung und den gespeicherten Stand prüfen.');
 }
}
