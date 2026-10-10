import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {identity} from './identity.mjs';
const require=createRequire(import.meta.url);
export async function pixelDifference(actual,expected,{channelTolerance=0}={}){
 const sharp=require(require.resolve('sharp',{paths:[require.resolve('next')]}));
 const decode=async file=>sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const [a,b]=await Promise.all([decode(actual),decode(expected)]);
 if(a.info.width!==b.info.width||a.info.height!==b.info.height)return {dimensionsMatch:false,actual:[a.info.width,a.info.height],expected:[b.info.width,b.info.height],changedRatio:1};
 let changed=0;for(let p=0;p<a.data.length;p+=4)if([0,1,2,3].some(c=>Math.abs(a.data[p+c]-b.data[p+c])>channelTolerance))changed++;
 return {dimensionsMatch:true,pixels:a.info.width*a.info.height,changedPixels:changed,changedRatio:changed/(a.info.width*a.info.height)};
}
// Each baseline is explicitly reviewed; missing baselines never become automatic passes.
export async function visualReport(folder,manifest='ux-compliance/visual-baselines.v1.json',out='docs/ux-compliance/visual.json'){
 const config=JSON.parse(fs.readFileSync(manifest,'utf8')),current=identity(),checks=[];
 for(const c of config.cases){
  if(!c.reviewer||!c.approvalReference||!c.engine||!c.route||!c.state)throw Error('Unreviewed visual baseline case');
  const actual=path.join(folder,c.actual),expected=path.join(path.dirname(manifest),c.baseline);
  const observed=fs.existsSync(actual)&&fs.existsSync(expected)?await pixelDifference(actual,expected,{channelTolerance:c.channelTolerance}):{reason:'Missing actual image or reviewed baseline'};
  checks.push({id:'UX-VIS-001',route:c.route,state:c.state,engine:c.engine,theme:c.theme,width:c.width,status:observed.reason?'not-tested':observed.dimensionsMatch&&observed.changedRatio<=c.allowedChangedRatio?'passed':'failed',observed,approvalReference:c.approvalReference});
 }
 const report={schemaVersion:1,...current,route:'reviewed visual cases',state:'visual',checks,coverage:config.cases.length?'Only explicitly reviewed cases':'No reviewed pixel baselines; visual regression remains untested'};
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');return report;
}
if(process.argv[1]===fileURLToPath(import.meta.url))await visualReport(process.argv[2]??'evidence/ux',process.argv[3]??undefined,process.argv[4]??undefined);
