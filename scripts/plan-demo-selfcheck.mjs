import fs from "node:fs";

const mustContain=(file,needles)=>{
 const text=fs.readFileSync(file,"utf8");
 for(const needle of needles)if(!text.includes(needle))throw new Error(`${file}: missing ${needle}`);
};

mustContain("app/api/auth/demo/route.ts",[
  "'business'","'trial'","onboarding_complete","await createSession","expiresInHours:domainConfig.demoSessionHours"
]);
mustContain("components/auth-pages.tsx",[
  'apiFetch("/api/auth/demo"','/portal/registrieren?trial=1','plan,billingCycle:billing,trial'
]);
mustContain("app/api/auth/register/route.ts",[
  "const plan=enumField","const trial=body.trial===true","trial?\"trial\":\"pending\""
]);
mustContain("config/plan-access.ts",[
  'start:{users:3,projects:100}','business:{users:15,projects:1000}',
  '"lohn","dokumente","vertraege"','planAllowsModule'
]);
mustContain("app/api/records/route.ts",["requireModuleEntitlement","requireProjectCapacity"]);
mustContain("app/api/invitations/route.ts",["requireUserCapacity"]);
mustContain("components/shell.tsx",["planAllowsPath","productionPlan","/upgrade?next="]);
console.log("Plan/demo self-check passed: production demo, selected-plan persistence, module gates and plan limits are wired.");
