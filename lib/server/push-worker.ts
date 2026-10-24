import 'server-only';
import {pushWorkerConfiguration,pushConfiguration} from './push-config';
import {dispatchPush} from './push';
import {log} from './logger';

type Worker={timer:ReturnType<typeof setTimeout>|null;running:boolean;stopped:boolean;failures:number;state:string;lastRunAt:string|null};
declare global {var __binsoPushWorker:Worker|undefined;}

/** One non-overlapping loop per process. Durable delivery claims coordinate replicas. */
export function startPushWorker(){
 if(globalThis.__binsoPushWorker&&!globalThis.__binsoPushWorker.stopped)return;
 const state:Worker={timer:null,running:false,stopped:false,failures:0,state:'',lastRunAt:null};
 globalThis.__binsoPushWorker=state;
 const record=(next:string)=>{if(state.state!==next){state.state=next;log(next==='running'||next==='starting'?'info':'warn','web_push_worker',{state:next});}};
 const schedule=(delay:number)=>{if(!state.stopped){state.timer=setTimeout(()=>{void tick();},delay);state.timer.unref();}};
 const tick=async()=>{
  if(state.stopped||state.running)return;
  state.running=true;
  let delay=pushWorkerConfiguration().intervalSeconds*1000;
  try{
   const config=pushWorkerConfiguration();
   if(!config.enabled){record(config.requested?'unavailable':'disabled');return;}
   const result=await dispatchPush(20);
   state.lastRunAt=new Date().toISOString();
   if(result.attempted)log('info','web_push_dispatch',{attempted:result.attempted,accepted:result.accepted,failed:result.failed,uncertain:result.uncertain,gone:result.gone});
   if(result.errors||result.failed||result.uncertain){state.failures++;record('degraded');}
   else{state.failures=0;record('running');}
  }catch{state.failures++;record('unavailable');}
  finally{
   state.running=false;
   if(state.failures)delay=Math.min(15*60*1000,delay*2**Math.min(state.failures,4));
   schedule(delay+Math.floor(Math.random()*5000));
  }
 };
 // No database work in register and no server startup dependency on provider availability.
 record(pushConfiguration().enabled?'starting':'unavailable');
 schedule(5000+Math.floor(Math.random()*5000));
}

export function pushWorkerStatus(){
 const worker=globalThis.__binsoPushWorker;
 return {state:worker?.state??'not_started',running:worker?.running??false,lastRunAt:worker?.lastRunAt??null};
}
