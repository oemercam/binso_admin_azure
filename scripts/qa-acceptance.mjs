/** Test coverage and acceptance scope are separate; production remains default. */
export function qaAcceptance({event,level,profile='production',ref,plannedLevel,browser}){
 if(!['production','development'].includes(profile))throw new Error('Unknown QA acceptance profile');
 const manualFull=event==='workflow_dispatch'&&level==='full';
 return {
  release:event==='release'||manualFull&&profile==='production',
  deployment:event==='push'&&ref==='refs/heads/main'||event==='pull_request'&&plannedLevel==='full'&&browser||manualFull&&profile==='development',
 };
}
