import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
if(Number(process.versions.node.split('.')[0])!==24)throw Error('Node.js 24 is required; activate the workspace runtime.');
const git=spawnSync('git',['--version'],{encoding:'utf8'});if(git.status!==0)throw Error('Git is required; activate the workspace runtime.');
const bash=process.platform==='win32'?path.resolve(process.env.GIT_EXEC_PATH??'', '../../../bin/bash.exe'):'bash';
if(process.platform==='win32'&&!fs.existsSync(bash))throw Error('Installed Git Bash is required for shell contract tests; activate runtime.ps1.');
if(spawnSync(bash,['--version'],{encoding:'utf8'}).status!==0)throw Error('Bash is required for shell contract tests.');
console.log(JSON.stringify({node:process.versions.node,git:git.stdout.trim(),platform:process.platform,protocolTransport:process.platform==='win32'?'in-memory duplex':'Unix sockets',privateManifest:process.platform==='win32'?'unsupported-fail-closed; Linux gate required':'POSIX ownership gate',nativePostgres:process.env.BINSO_DB_PARALLEL_TEST_URL?'explicit isolated URL configured':'separate PostgreSQL 18 service required',productionAcceptance:false}));
