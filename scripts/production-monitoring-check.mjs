import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export async function inspectMonitoring(resources,get){
 const [app,insights,alert,group]=await Promise.all([get(resources.app,'2024-11-01'),get(resources.insights,'2020-02-02'),get(resources.alert,'2018-03-01'),get(resources.actionGroup,'2023-01-01')]);
 const same=(a,b)=>typeof a==='string'&&a.toLowerCase()===b.toLowerCase();
 if(!same(app.id,resources.app))throw Error('Wrong monitored application');
 if(!insights.properties?.WorkspaceResourceId)throw Error('Application Insights workspace missing');
 if(!alert.properties?.enabled||!alert.properties.scopes?.some(id=>same(id,resources.app)))throw Error('Enabled alert must target the actual app across subscriptions');
 if(!alert.properties.actions?.some(a=>same(a.actionGroupId,resources.actionGroup)))throw Error('Alert must reference the verified action group');
 if(!group.properties?.enabled)throw Error('Action group disabled');
 const receivers=['emailReceivers','armRoleReceivers','webhookReceivers','smsReceivers','azureFunctionReceivers','logicAppReceivers'].reduce((n,key)=>n+(group.properties[key]?.length??0),0);
 if(!receivers)throw Error('Action group has no receivers');
 return {application:app.id,insights:true,scopedAlert:true,activeReceivers:receivers,deliveryProven:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const resources=JSON.parse(fs.readFileSync('.github/model-a/readiness-resources.json','utf8'));
 const get=async(id,version)=>{
  if(!/^\/subscriptions\/[a-f0-9-]+\/resourceGroups\//i.test(id))throw Error('Invalid ARM resource identity');
  return JSON.parse(execFileSync('az',['rest','--method','get','--url','https://management.azure.com'+id+'?api-version='+version,'--output','json'],{encoding:'utf8'}));
 };
 console.log(JSON.stringify(await inspectMonitoring(resources,get)));
}
