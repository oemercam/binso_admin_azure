import "server-only";

function optional(name:string){return process.env[name]?.trim()||undefined}
function required(name:string){
  const value=optional(name);
  if(!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
function bool(name:string, fallback=false){
  const v=optional(name);
  if(!v)return fallback;
  return ["1","true","yes","on"].includes(v.toLowerCase());
}
function int(name:string,fallback:number){
  const n=Number(optional(name));
  return Number.isFinite(n)?n:fallback;
}

export const env={
  appMode:(optional("APP_MODE")==="production"?"production":"local") as "local"|"production",
  appUrl:optional("APP_URL")||"http://localhost:3000",
  sessionCookieName:optional("SESSION_COOKIE_NAME")||"binso_session",
  operatorSessionCookieName:optional("OPERATOR_SESSION_COOKIE_NAME")||"binso_operator_session",
  operatorEntraTenantId:optional("OPERATOR_ENTRA_TENANT_ID"),
  operatorAllowedDomain:optional("OPERATOR_ALLOWED_DOMAIN")||"binso.ch",
  sessionTtlHours:int("SESSION_TTL_HOURS",168),
  databaseUrl:optional("DATABASE_URL"),
  databaseSsl:bool("DATABASE_SSL",true),
  databaseSslRejectUnauthorized:bool("DATABASE_SSL_REJECT_UNAUTHORIZED",true),
  databasePoolMax:int("DATABASE_POOL_MAX",10),
  stripeSecretKey:optional("STRIPE_SECRET_KEY"),
  stripeWebhookSecret:optional("STRIPE_WEBHOOK_SECRET"),
  stripeAutomaticTax:bool("STRIPE_AUTOMATIC_TAX",false),
  stripePortalReturnUrl:optional("STRIPE_PORTAL_RETURN_URL"),
  stripePrices:{
    start:{monthly:optional("STRIPE_PRICE_START_MONTHLY"),yearly:optional("STRIPE_PRICE_START_YEARLY")},
    business:{monthly:optional("STRIPE_PRICE_BUSINESS_MONTHLY"),yearly:optional("STRIPE_PRICE_BUSINESS_YEARLY")},
    pro:{monthly:optional("STRIPE_PRICE_PRO_MONTHLY"),yearly:optional("STRIPE_PRICE_PRO_YEARLY")}
  },
  appEncryptionKey:optional("APP_ENCRYPTION_KEY"),
  emailDeliveryMode:optional("EMAIL_DELIVERY_MODE")||"auto",
  graphTenantId:optional("GRAPH_TENANT_ID"),
  graphClientId:optional("GRAPH_CLIENT_ID"),
  graphClientSecret:optional("GRAPH_CLIENT_SECRET"),
  graphSenderUserId:optional("GRAPH_SENDER_USER_ID"),
  resendApiKey:optional("RESEND_API_KEY"),
  emailFrom:optional("EMAIL_FROM")||"Binso One <noreply@binso.ch>",
  supportEmail:optional("SUPPORT_EMAIL")||"support@binso.ch",
  azureStorageAccount:optional("AZURE_STORAGE_ACCOUNT"),
  azureStorageContainer:optional("AZURE_STORAGE_CONTAINER")||"documents",
  azureStorageSas:optional("AZURE_STORAGE_SAS"),
  smokeTestToken:optional("BINSO_SMOKE_TEST_TOKEN"),
  logLevel:optional("LOG_LEVEL")||"info"
};

export function requireDatabaseUrl(){return required("DATABASE_URL")}
