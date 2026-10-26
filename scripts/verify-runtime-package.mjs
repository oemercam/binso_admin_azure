import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export function verifyRuntimePackage(directory,sha){
 if(!/^[a-f0-9]{40}$/.test(sha??''))throw Error('Immutable runtime source SHA required');
 const root=path.resolve(directory);
 for(const file of fs.readdirSync(root))if(file.startsWith('.env')||['.git','.npmrc'].includes(file))throw Error('Private or build-only file in runtime package: '+file);
 for(const file of ['server.js','.next/BUILD_ID','.next/required-server-files.json','public/sw.js','public/manifest-app.webmanifest','public/deployment.json','scripts/start-scanner-production.mjs','scripts/scanner-bridge.mjs','lib/server/clamav-protocol.mjs'])if(!fs.statSync(path.join(root,file)).isFile())throw Error('Missing runtime package file: '+file);
 for(const directory of ['.next/static','.next/server','node_modules/next'])if(!fs.statSync(path.join(root,directory)).isDirectory())throw Error('Missing runtime package directory: '+directory);
 // TypeScript is also a declared swissqrbill runtime peer in the locked graph;
 // it cannot be classified as dev-only merely from the root devDependencies.
 for(const dependency of ['eslint','eslint-config-next','@electric-sql/pglite'])if(fs.existsSync(path.join(root,'node_modules',dependency)))throw Error('Development dependency in production package: '+dependency);
 const config=JSON.parse(fs.readFileSync(path.join(root,'.next/required-server-files.json'),'utf8'));
 const deployment=JSON.parse(fs.readFileSync(path.join(root,'public/deployment.json'),'utf8'));
 if(config.config?.output!=='standalone'||config.config.env?.BINSO_BUILD_SHA!==sha||deployment.sha!==sha)throw Error('Runtime package does not match the built source SHA');
 return {sourceSha:sha,buildId:fs.readFileSync(path.join(root,'.next/BUILD_ID'),'utf8').trim()};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const [directory,sha]=process.argv.slice(2);if(!directory)throw Error('Usage: verify-runtime-package.mjs DIRECTORY SHA');
 console.log('Runtime package verified: '+JSON.stringify(verifyRuntimePackage(directory,sha)));
}
