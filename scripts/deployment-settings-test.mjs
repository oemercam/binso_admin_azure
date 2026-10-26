import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const workflow=await fs.readFile('.github/workflows/deploy-azure.yml','utf8');
assert.match(workflow,/node scripts\/deployment-setting\.mjs "\$1"/,'Deployment must execute the tested settings predicate');
for(const [settings,name,expected] of [
 [[], 'retired',1],
 [[{name:'retired',value:'synthetic'}],'retired',0],
 [[{name:'current',value:'retired'}],'retired',1],
 [[{name:'current',value:'synthetic'},{name:'retired',value:'synthetic'}],'retired',0],
 [[{name:'retired-suffix',value:'synthetic'}],'retired',1],
 [{invalid:'collection'},'retired',5]
]){
 const result=spawnSync(process.execPath,['scripts/deployment-setting.mjs',name],{input:JSON.stringify(settings),encoding:'utf8'});
 if(result.error)throw result.error;
 assert.equal(result.status,expected,'Actual deployment predicate must detect exact setting names without treating values as objects: '+result.stderr);
}
console.log('Actual deployment predicate: present, absent, empty, later entry and name/value/suffix countercases passed without an undeclared jq dependency.');
