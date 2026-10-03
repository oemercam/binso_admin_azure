import "server-only";

type Level="debug"|"info"|"warn"|"error";
const SENSITIVE_KEYS=new Set(["password","token","authorization","cookie","email","phone","iban","card","cvc"]);

function redact(value:unknown,key=""):unknown{
  if(SENSITIVE_KEYS.has(key.toLowerCase()))return "[REDACTED]";
  if(Array.isArray(value))return value.map(v=>redact(v));
  if(value&&typeof value==="object"){
    return Object.fromEntries(Object.entries(value as Record<string,unknown>).map(([k,v])=>[k,redact(v,k)]));
  }
  return value;
}

export function log(level:Level,message:string,context:Record<string,unknown>={}){
  const safeContext=redact(context) as Record<string,unknown>;
  const entry={timestamp:new Date().toISOString(),level,message,...safeContext};
  const line=JSON.stringify(entry);
  if(level==="error")console.error(line);
  else if(level==="warn")console.warn(line);
  else console.log(line);
}
