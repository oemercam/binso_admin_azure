const configured=Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function useProductionBackend(){
  if(!configured) return false;
  if(typeof window!=="undefined" && window.localStorage.getItem("binso.demo.session")==="1") return false;
  return true;
}

export function clearDemoClientSession(){
  if(typeof window!=="undefined") window.localStorage.removeItem("binso.demo.session");
}

export async function apiPost<T>(path:string,body:unknown):Promise<T>{
  const response=await fetch(path,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body),
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){
    const message=typeof payload?.message==="string"?payload.message:"Die Anfrage konnte nicht verarbeitet werden.";
    throw new Error(message);
  }
  return payload as T;
}


export async function apiGet<T>(path:string):Promise<T>{
  const response=await fetch(path,{method:"GET",cache:"no-store"});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){
    const message=typeof payload?.message==="string"?payload.message:"Daten konnten nicht geladen werden.";
    throw new Error(message);
  }
  return payload as T;
}


export async function apiPatch<T>(path:string,body:unknown):Promise<T>{
  const response=await fetch(path,{
    method:"PATCH",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body),
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){
    const message=typeof payload?.message==="string"?payload.message:"Änderung konnte nicht gespeichert werden.";
    throw new Error(message);
  }
  return payload as T;
}
