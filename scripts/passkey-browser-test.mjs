import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {pathToFileURL} from 'node:url';
import {generateRegistrationOptions,generateAuthenticationOptions,verifyRegistrationResponse,verifyAuthenticationResponse} from '@simplewebauthn/server';
import {assertIdentityReference} from './identity-reference-browser.mjs';
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const port=await new Promise(resolve=>{const probe=createServer();probe.listen(0,'127.0.0.1',()=>{const value=probe.address().port;probe.close(()=>resolve(value));});});
const base='http://localhost:'+port,output=process.env.BINSO_PASSKEY_OUTPUT??'.qa/passkey-browser';
await fs.mkdir(output,{recursive:true});
// UI-only synthetic HTTP fixture. Real backend/RLS/transactions are independently
// exercised by passkey-test.mjs; this never contacts an Azure account or sends mail.
const serverEnv={...process.env,APP_URL:base,APP_MODE:'local',DATABASE_URL:'',SESSION_COOKIE_NAME:'binso_passkey_ui_fixture',PORT:String(port),HOSTNAME:'127.0.0.1'};
for(const key of Object.keys(serverEnv))if(/^(STRIPE_|GRAPH_|AZURE_STORAGE_|IDENTITY_|ACTIONS_ID_TOKEN_)/.test(key))serverEnv[key]='';
const server=spawn(process.execPath,process.env.BINSO_UX_SERVER_FILE?[process.env.BINSO_UX_SERVER_FILE]:['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env:serverEnv,stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',value=>logs+=value);server.stderr.on('data',value=>logs+=value);
let browser;
try{
 for(let attempt=0;;attempt++){try{if((await fetch(base+'/login')).ok)break;}catch{}if(attempt>100||server.exitCode!==null)throw Error(logs);await new Promise(resolve=>setTimeout(resolve,200));}
 browser=await engines.chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage();
 // Only satisfy the routing proxy's presence check. All authenticated HTTP
 // responses below are explicitly synthetic; this is never a backend token.
 await context.addCookies([{name:'binso_passkey_ui_fixture',value:'synthetic-ui-only-not-a-session',url:base}]);
 await context.addInitScript(()=>{
  localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false}));
  PublicKeyCredential.isConditionalMediationAvailable=async()=>location.pathname==='/login';
  const nativeGet=navigator.credentials.get.bind(navigator.credentials);
  // Hold only the browser's conditional chooser, which has no headless native
  // account-selection UI. Synthetic selection below still uses real WebAuthn.
  navigator.credentials.get=options=>{if(options.mediation==='conditional'){window.syntheticConditionalPending=true;return new Promise((resolve,reject)=>{window.syntheticSelectStoredCredential=()=>nativeGet({...options,mediation:'optional'}).then(resolve,reject);options.signal.addEventListener('abort',()=>reject(new DOMException('Synthetic chooser cancelled','AbortError')),{once:true});});}return nativeGet(options);};
 });
 const cdp=await context.newCDPSession(page);await cdp.send('WebAuthn.enable');
 await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,automaticPresenceSimulation:true}});
 let credential,challenge,items=[],fresh=false,loginVerifications=0,reauthVerifications=0,loginOptions=0,passwordLogins=0;
 await context.route('**/api/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname,body=request.postDataJSON()??{};
  const respond=(json,status=200)=>route.fulfill({status,json});
  try{
   if(path==='/api/auth/login'){assert.equal(body.email,'stored@fixture.invalid');assert.equal(body.password,'Synthetic-stored-password-123');passwordLogins++;return respond({ok:true,next:'/dashboard'});}
   if(path==='/api/auth/session')return respond({authenticated:true,user:{id:'synthetic-passkey'},security:{mfaEnabled:true,enrollmentRequired:false},tenant:{id:'synthetic-company',role:'owner',plan:'pro'}});
   if(path==='/api/settings/profile')return respond({item:{id:'synthetic-passkey',name:'Synthetic',display_name:'Synthetic',email:'passkey@fixture.invalid'}});
   if(path==='/api/auth/mfa')return respond({enabled:true,required:false});
   if(path==='/api/auth/sessions')return respond({items:[]});
   if(path==='/api/auth/reauthenticate'){if(body.action==='confirm'){assert.equal(body.code,'123456');fresh=true;return respond({ok:true});}return respond({method:'totp'});}
   if(path==='/api/auth/passkeys/options'){
    if(body.mode==='register'){
     if(!fresh)return respond({error:'fresh_authentication_required'},403);
     const value=await generateRegistrationOptions({rpName:'Binso One',rpID:'localhost',userName:'passkey@fixture.invalid',userID:new Uint8Array([1,2,3]),attestationType:'none',authenticatorSelection:{residentKey:'required',userVerification:'required'}});challenge=value.challenge;return respond(value);
    }
    if(body.mode==='authenticate')loginOptions++;
    const value=await generateAuthenticationOptions({rpID:'localhost',userVerification:'required'});challenge=value.challenge;return respond(value);
   }
   if(path==='/api/auth/passkeys/verify'){
    if(body.mode==='register'){
     const verified=await verifyRegistrationResponse({response:body.response,expectedChallenge:challenge,expectedOrigin:base,expectedRPID:'localhost',requireUserVerification:true});assert.ok(verified.verified);
     credential=verified.registrationInfo.credential;items=[{id:credential.id,label:'Notebook',created_at:new Date().toISOString(),last_used_at:null}];fresh=false;
     return respond({ok:true,notice:'accepted',recoveryCodes:Array.from({length:8},(_,index)=>'01234567-89ABCDEF-01234567-89ABCDE'+index)});
    }
    const verified=await verifyAuthenticationResponse({response:body.response,expectedChallenge:challenge,expectedOrigin:base,expectedRPID:'localhost',credential,requireUserVerification:true});assert.ok(verified.verified);credential.counter=verified.authenticationInfo.newCounter;
    if(body.mode==='reauthenticate'){fresh=true;reauthVerifications++;return respond({ok:true});}
    loginVerifications++;return respond({ok:true,next:'/dashboard'});
   }
   if(path==='/api/auth/passkeys'){
    if(request.method()==='PATCH'){
     if(!fresh)return respond({error:'fresh_authentication_required'},403);
     assert.equal(body.action,'rename');items[0].label=body.label;fresh=false;return respond({ok:true,notice:'accepted'});
    }
    return respond({items,offer:false});
   }
   return respond({items:[],item:{},stats:{},unreadCount:0});
  }catch(error){await respond({error:'synthetic_verification_failed',message:String(error)},400);}
 });
 await page.goto(base+'/einstellungen/sicherheit');
 await page.getByRole('button',{name:'Passkey hinzufügen',exact:true}).click();
 const sheet=page.getByRole('dialog',{name:'Passkey hinzufügen',exact:true});await sheet.getByLabel('Bezeichnung',{exact:true}).fill('Notebook');await sheet.getByRole('button',{name:'Passkey hinzufügen',exact:true}).click();
 const proof=page.getByRole('dialog',{name:'Aktion bestätigen',exact:true});await proof.getByLabel('Aktuelles Passwort').fill('Synthetic-password-only');await proof.getByRole('button',{name:'Weiter',exact:true}).click();await proof.getByLabel('Authenticator- oder Recovery-Code').fill('123456');await proof.getByRole('button',{name:'Aktion bestätigen',exact:true}).click();
 await page.getByRole('button',{name:'Notebook',exact:false}).waitFor();assert.equal(items.length,1);await page.getByText('01234567-89ABCDEF-01234567-89ABCDE0',{exact:true}).waitFor();await page.screenshot({path:output+'/registered-mobile.png',fullPage:true});
 await page.setViewportSize({width:320,height:740});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'One-time recovery codes fit the narrow screen');
 const recoveryAction=page.getByRole('button',{name:'Neue Wiederherstellungscodes erstellen',exact:true});
 assert.ok(await recoveryAction.evaluate(node=>{const bounds=node.getBoundingClientRect(),owner=node.closest('.bo-settings-group-body').getBoundingClientRect();return bounds.left>=owner.left-1&&bounds.right<=owner.right+1&&node.querySelector('.action-row-label').scrollWidth<=node.querySelector('.action-row-label').clientWidth;}),'The full recovery action stays inside its owner and wraps without clipping');
 await page.screenshot({path:output+'/registered-320.png',fullPage:true});
 await page.getByRole('button',{name:'Notebook',exact:false}).click();
 const manage=page.getByRole('dialog',{name:'Passkey verwalten',exact:true});await manage.getByLabel('Bezeichnung',{exact:true}).fill('Mein Notebook');await manage.getByRole('button',{name:'Bezeichnung speichern',exact:true}).click();
 await proof.getByRole('button',{name:'Mit Passkey bestätigen',exact:true}).click();await page.getByRole('button',{name:'Mein Notebook',exact:false}).waitFor();assert.equal(reauthVerifications,1);
 await page.goto(base+'/login');await page.waitForFunction(()=>window.syntheticConditionalPending===true);assert.equal(await page.getByRole('button',{name:'Mit Passkey anmelden',exact:true}).count(),0);await page.evaluate(()=>{void window.syntheticSelectStoredCredential();});await page.waitForURL('**/dashboard');assert.equal(loginVerifications,1,'One stored-credential selection produces one verification and no TOTP screen');assert.equal(loginOptions,1,'The selected stored credential uses its single conditional challenge');
 await page.goto(base+'/login');await page.setViewportSize({width:390,height:844});await page.screenshot({path:output+'/login-mobile.png',fullPage:true});await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:output+'/login-desktop.png',fullPage:true});assert.equal(await page.locator('input[autocomplete="username webauthn"]').count(),1);await page.getByRole('button',{name:'Anmelden',exact:true}).waitFor();
 const geometry=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));assert.ok(geometry.scroll<=geometry.width);
 await assertIdentityReference({page,context,width:1440,output});
 const optionsBeforePassword=loginOptions;await page.locator('input[name=username]').fill('stored@fixture.invalid');await page.locator('input[name=password]').fill('Synthetic-stored-password-123');await page.getByRole('button',{name:'Anmelden',exact:true}).click();await page.waitForURL('**/dashboard');assert.equal(passwordLogins,1);assert.equal(loginVerifications,1,'Password sign-in does not trigger a passkey verification');assert.equal(loginOptions,optionsBeforePassword,'Typing stored credentials does not recreate conditional challenges');
 await context.close();
 const unsupported=await browser.newContext({viewport:{width:390,height:844}});await unsupported.addInitScript(()=>{Object.defineProperty(window,'PublicKeyCredential',{value:undefined,configurable:true});});const fallback=await unsupported.newPage();await fallback.goto(base+'/login');await fallback.getByRole('button',{name:'Anmelden',exact:true}).waitFor();assert.equal(await fallback.getByRole('button',{name:'Mit Passkey anmelden',exact:true}).count(),0);await assertIdentityReference({page:fallback,context:unsupported,width:390,output});await unsupported.close();
 await fs.writeFile(output+'/result.json',JSON.stringify({passed:true,engine:'chromium',virtualAuthenticator:true,physicalDevice:false,conditionalCoordination:'synthetic native-chooser selection completed with real WebAuthn',nativeAutofillSelection:false,backend:'synthetic HTTP fixture; actual backend tested separately',loginVerifications,reauthVerifications,passwordLogins},null,2));
 console.log('Passkey browser: actual native WebAuthn through virtual CTAP2, enrollment, strong reauth, rename, single login without TOTP, responsive login and unsupported-device password fallback passed. Physical devices and conditional autofill selection remain external checks.');
}catch(error){for(const context of browser?.contexts()??[])for(const page of context.pages()){await page.screenshot({path:output+'/failure.png',fullPage:true}).catch(()=>{});await fs.writeFile(output+'/failure.txt',page.url()+'\n'+(await page.locator('body').innerText().catch(()=>'')).slice(0,6000));}throw error;
}finally{await browser?.close();server.kill();}
