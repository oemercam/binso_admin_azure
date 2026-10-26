import assert from 'node:assert/strict';
import {inspectMonitoring} from './production-monitoring-check.mjs';
export async function verifyMonitoringContract(){
 const resources={app:'/subscriptions/app/resourceGroups/rg/app',insights:'/subscriptions/monitor/resourceGroups/rg/insights',alert:'/subscriptions/monitor/resourceGroups/rg/alert',actionGroup:'/subscriptions/monitor/resourceGroups/rg/group'};
 const fixture={
  [resources.app]:{id:resources.app},
  [resources.insights]:{properties:{WorkspaceResourceId:'workspace'}},
  [resources.alert]:{properties:{enabled:true,scopes:[resources.app],actions:[{actionGroupId:resources.actionGroup}]}},
  [resources.actionGroup]:{properties:{enabled:true,armRoleReceivers:[{name:'fixture'}]}}
 };
 const run=state=>inspectMonitoring(resources,async id=>state[id]);
 assert.equal((await run(fixture)).deliveryProven,false);
 for(const mutate of [s=>s[resources.alert].properties.scopes=['foreign-app'],s=>s[resources.alert].properties.enabled=false,s=>s[resources.alert].properties.actions=[],s=>s[resources.actionGroup].properties.enabled=false,s=>s[resources.actionGroup].properties.armRoleReceivers=[],s=>delete s[resources.insights].properties.WorkspaceResourceId]){
  const state=structuredClone(fixture);mutate(state);await assert.rejects(run(state));
 }
 await assert.rejects(inspectMonitoring(resources,async()=>{throw Error('denied')}));
 console.log('Monitoring validates exact cross-subscription target, enabled rules, action binding, receivers and denied reads; never claims delivery.');
}
