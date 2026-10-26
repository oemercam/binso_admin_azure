import fs from 'node:fs';
import pg from 'pg';
import {readScope} from './compliance/release-scope.mjs';
const url=process.env.BINSO_RUNTIME_URL;
if(!url||!process.env.BINSO_SETTINGS_FILE)throw Error('Verified runtime URL and private output file required');
const client=new pg.Client({connectionString:url,ssl:{rejectUnauthorized:true}});
if(!client.connectionParameters.ssl||client.connectionParameters.ssl.rejectUnauthorized===false)throw Error('Effective database TLS must verify certificates');
const scope=readScope(),scanner=process.env.BINSO_QUALIFIED_SCANNER==='true';
if(scanner&&process.env.BINSO_APPROVE_SCANNER!=='true')throw Error('Qualified scanner still requires explicit activation approval');
fs.writeFileSync(process.env.BINSO_SETTINGS_FILE,JSON.stringify({
 DATABASE_URL:url,DATABASE_SSL:'true',DATABASE_SSL_REJECT_UNAUTHORIZED:'true',
 BINSO_RELEASE_PROFILE:scope.id,BINSO_FILE_ACCESS_MODE:'clean-only',
 BINSO_SCANNER_SIDECAR:String(scanner),FILE_SCAN_SOCKET:scanner?'/tmp/binso-scanner/clamd.sock':''
}),{mode:0o600,flag:'w'});
