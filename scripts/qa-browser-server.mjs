import path from 'node:path';
/** All child browser proofs must inspect the same qualified artifact as their
 * parent. A missing candidate is a real error, never a reason to use dev mode. */
export function qaBrowserServer(port,environment=process.env){
 const value=Number(port);if(!Number.isInteger(value)||value<1024||value>65535)throw Error('Invalid isolated QA port');
 const candidate=environment.BINSO_UX_SERVER_FILE;
 return {
  args:candidate?[candidate]:['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(value)],
  env:{...environment,PORT:String(value),HOSTNAME:'127.0.0.1'},
  staticDirectory:path.join(candidate?path.dirname(path.resolve(candidate)):process.cwd(),'.next','static'),
 };
}
