import {spawn} from 'node:child_process';
// Reference cases are development-only, synthetic and local. Never target a live URL.
if(process.env.BINSO_BASE_URL)throw new Error('UX-Lab regression must start its own local development server.');
const env={...process.env,BINSO_UX_SERVER_MODE:'dev',BINSO_UX_ROUTES:'/dev/ux-lab',BINSO_UX_WIDTHS:'390,1440',BINSO_UX_THEMES:'light,dark',BINSO_UX_INTERACTIONS:'lab',BINSO_UX_MATRIX_ONLY:'0',BINSO_UX_PORT:'3220',BINSO_UX_CAPTURE_ALL:'1',BINSO_UX_SCREENSHOTS:'1',BINSO_UX_DOM_EVIDENCE:'1',BINSO_UX_OUTPUT:process.env.BINSO_LAB_OUTPUT??'/tmp/binso-ux-lab'};
delete env.BINSO_UX_SERVER_FILE;
const child=spawn(process.execPath,['scripts/ux-browser-test.mjs'],{stdio:'inherit',env});
child.on('error',error=>{console.error(error);process.exitCode=1});
child.on('exit',code=>{process.exitCode=code??1});
