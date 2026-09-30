import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const rootProviders=read("components/client-providers.tsx");
const shell=read("components/shell.tsx");
const runtime=read("components/workspace-runtime.tsx");
const demo=read("app/api/auth/demo/route.ts");
const layout=read("app/layout.tsx");

for(const name of ["AnnouncementHost","PilotFeedbackHost","SupportTelemetryHost"]){
 if(rootProviders.includes(name))throw new Error(`${name} must not be mounted globally; it belongs to authenticated workspace runtime.`);
 if(!runtime.includes(name))throw new Error(`${name} missing from WorkspaceRuntime.`);
}
if(!shell.includes("permissionsReady&&<WorkspaceRuntime"))throw new Error("Workspace runtime must mount only after session/permission readiness.");
if(!demo.includes("set_config('app.organization_id'")||!demo.includes("set_config('app.user_id'"))throw new Error("Demo seed must establish RLS tenant/user context.");
if(layout.includes('from "next/script"')||layout.includes('<Script src="/theme-init.js"'))throw new Error("Theme bootstrap must not use Next Script preload; use a blocking head script to avoid service-worker preload mismatch.");
console.log("Runtime boundary self-check passed: public routes avoid authenticated API hosts, workspace services wait for session readiness, demo RLS context is present, and theme bootstrap avoids Next preload mismatch.");
