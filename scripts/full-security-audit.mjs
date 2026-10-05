import {spawnSync} from "node:child_process";

const allowed=new Set(["GHSA-VFJ7-8CJW-P6XM"]);
const result=spawnSync("pnpm",["audit","--audit-level","high","--json"],{
  encoding:"utf8",
  shell:process.platform==="win32"
});

if(result.error)throw result.error;

const output=(result.stdout||"").trim();
if(result.status===0){
  console.log("Full dependency audit passed with no High/Critical findings.");
  process.exit(0);
}

let report;
try{
  report=JSON.parse(output);
}catch{
  process.stderr.write(result.stderr||"");
  throw new Error("pnpm audit failed and did not return parseable JSON.");
}

const serialized=JSON.stringify(report);
const found=new Set(serialized.match(/GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/gi)?.map(id=>id.toUpperCase())??[]);
if(found.size===0){
  process.stderr.write(result.stderr||"");
  throw new Error("pnpm audit failed but no GHSA identifier could be verified.");
}

const unexpected=[...found].filter(id=>!allowed.has(id));
if(unexpected.length){
  console.error("Unapproved High/Critical dependency advisories:",unexpected.join(", "));
  process.exit(1);
}

console.warn("Accepted temporary dev-tool advisory:",[...found].join(", "));
console.warn("See docs/dependency-security-review.md. Any other High/Critical advisory remains blocking.");
