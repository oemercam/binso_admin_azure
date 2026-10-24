/** Next invokes register once per server instance; no Edge/build-time push dispatch. */
export async function register(){
 if(process.env.NEXT_RUNTIME==='nodejs'&&process.env.NODE_ENV==='production'&&process.env.NEXT_PHASE!=='phase-production-build'&&process.env.WEB_PUSH_WORKER_ENABLED==='true'){
  const {startPushWorker}=await import('./lib/server/push-worker');
  startPushWorker();
 }
}
