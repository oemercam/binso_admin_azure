type BackendEnv={databaseUrl:string;appUrl:string;azureStorageAccount:string;azureStorageContainer:string;azureStorageSas:string;resendApiKey:string;emailFrom:string;stripeSecretKey:string;stripeWebhookSecret:string};
function clean(value:string|undefined){return (value??"").trim();}
export function getBackendEnv():BackendEnv{return {
 databaseUrl:clean(process.env.DATABASE_URL),
 appUrl:clean(process.env.NEXT_PUBLIC_APP_URL)||"http://localhost:3000",
 azureStorageAccount:clean(process.env.AZURE_STORAGE_ACCOUNT),
 azureStorageContainer:clean(process.env.AZURE_STORAGE_CONTAINER)||"binso-one",
 azureStorageSas:clean(process.env.AZURE_STORAGE_SAS),
 resendApiKey:clean(process.env.RESEND_API_KEY),
 emailFrom:clean(process.env.EMAIL_FROM)||"Binso One <noreply@binso.ch>",
 stripeSecretKey:clean(process.env.STRIPE_SECRET_KEY),
 stripeWebhookSecret:clean(process.env.STRIPE_WEBHOOK_SECRET),
};}
export function isBackendConfigured(){return Boolean(clean(process.env.DATABASE_URL));}
