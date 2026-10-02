type BackendEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appUrl: string;
};

function required(name:string,value:string|undefined){
  if(!value) throw new Error("Missing required environment variable: " + name);
  return value.replace(/\/$/,"");
}

export function getBackendEnv():BackendEnv {
  return {
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL",process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY",process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/,""),
  };
}

export function isBackendConfigured(){
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
