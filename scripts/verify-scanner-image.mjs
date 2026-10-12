import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const [directory,sourceSha]=process.argv.slice(2);
assert.ok(directory);assert.match(sourceSha??'',/^[0-9a-f]{40}$/);
const metadata=JSON.parse(fs.readFileSync(path.join(directory,'qualified-image.json'),'utf8'));
assert.equal(metadata.schemaVersion,1);assert.equal(metadata.sourceSha,sourceSha,'Scanner and app must belong to the same approved Main commit');
assert.equal(metadata.qualification?.qualified,true,'Scanner qualification must have completed');
assert.match(metadata.imageId,/^sha256:[0-9a-f]{64}$/);assert.match(metadata.archiveSha256,/^[0-9a-f]{64}$/);
const hash=createHash('sha256');for await(const chunk of fs.createReadStream(path.join(directory,'image.tar.gz')))hash.update(chunk);
assert.equal(hash.digest('hex'),metadata.archiveSha256,'Qualified image archive must be unmodified');
// Only the expected content-addressed Docker ID is emitted, for comparison after load.
console.log(metadata.imageId);
