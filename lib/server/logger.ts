import "server-only";

type Level="debug"|"info"|"warn"|"error";
const SENSITIVE_KEYS=new Set(["password","token","authorization","cookie","email","phone","iban","card","cvc","detail","message","error","stack","subject","todomain","access_token","refresh_token","client_secret","password_hash","mfa_secret_enc","mfa_pending_secret_enc","recovery_code_hashes"]);

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
  const entry={...safeContext,timestamp:new Date().toISOString(),level,message};
  const line=JSON.stringify(entry);
  if(level==="error")console.error(line);
  else if(level==="warn")console.warn(line);
  else console.log(line);
}
