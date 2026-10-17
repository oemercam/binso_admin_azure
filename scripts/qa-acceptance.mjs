/** Test coverage and acceptance scope are separate; production remains default. */
import {isDocumentationOnlyChange} from './qa-plan.mjs';
export function qaAcceptance({event,level,profile='production',ref,plannedLevel,browser,files=[]}){
 if(!['production','development'].includes(profile))throw new Error('Unknown QA acceptance profile');
 const manualFull=event==='workflow_dispatch'&&level==='full';
 // A missing browser flag alone is never evidence of a documentation-only diff.
 // Keep static --gate checks active; this does not grant visual/release acceptance.
 const documentationPush=event==='push'&&ref==='refs/heads/main'&&
  plannedLevel==='standard'&&browser===false&&isDocumentationOnlyChange(files);
 return {
  release:event==='release'||manualFull&&profile==='production',
  deployment:event==='push'&&ref==='refs/heads/main'&&!documentationPush||event==='pull_request'&&plannedLevel==='full'&&browser||manualFull&&profile==='development',
 };
}
