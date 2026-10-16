import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

export function browserLanes(plan){
 if(!['standard','full','fast','integration'].includes(plan.level))throw Error('Invalid browser plan level');
 if(!plan.routes.length)return [];
 const shards=plan.level==='full'?3:1;
 return ['chromium','webkit'].flatMap(engine=>[
  {engine,lane:'functional',shard:0,shards:1},
  ...Array.from({length:shards},(_,shard)=>({engine,lane:'responsive',shard,shards})),
 ]);
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const matrix=JSON.stringify(browserLanes(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))));
 console.log(matrix);
 if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`matrix=${matrix}\n`);
}
