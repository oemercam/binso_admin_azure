/** Accept only an app-local URL path for authentication and onboarding handoffs. */
export function safeAppPath(value:unknown,fallback="/dashboard"):string{
 if(typeof value!=="string"||!value.startsWith("/")||value.startsWith("//")||/[\\\u0000-\u0020\u007f]/.test(value))return fallback;
 // Browsers normalize backslashes and control characters before resolving URLs.
 // Encoded path separators are unnecessary in an auth handoff and are rejected too.
 if(/%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(value.split(/[?#]/,1)[0]))return fallback;
 try{const origin="https://binso.invalid",url=new URL(value,origin);return url.origin===origin?url.pathname+url.search+url.hash:fallback}catch{return fallback}
}
