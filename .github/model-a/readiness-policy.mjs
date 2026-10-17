// Configuration validation is not proof of effective Azure RBAC. Operational
// activation stays blocked until the actual identity/federation/roles are checked.
export function validateReadinessConfiguration(env){
 if(env.GITHUB_REPOSITORY!=='oemercam/binso_admin_azure'||env.GITHUB_REF!=='refs/heads/main')throw new Error('Readiness requires this repository and protected main');
 for(const name of ['READINESS_CLIENT_ID','READINESS_TENANT_ID','READINESS_SUBSCRIPTION_ID']){
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(env[name]??''))throw new Error('Missing or invalid dedicated '+name+'; deployment credentials cannot substitute');
 }
 return true;
}
