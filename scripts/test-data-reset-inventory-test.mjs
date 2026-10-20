import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {inventoryTestData} from './test-data-reset-inventory.mjs';

const db=new PGlite();
try{
 await db.exec(`create table organizations(id uuid primary key,name text,status text,is_demo boolean);
 create table app_users(id text primary key,email text);
 create table platform_operator_assignments(user_id text);
 create table organization_memberships(organization_id uuid,user_id text);
 create table file_objects(organization_id uuid,blob_url text);
 create table organization_subscriptions(organization_id uuid,billing_customer_id text,billing_subscription_id text);
 create table invoices(organization_id uuid,total numeric);
 insert into organizations values('00000000-0000-4000-8000-000000000001','Private test company','active',false),('00000000-0000-4000-8000-000000000099','Template','active',true);
 insert into app_users values('admin','private@fixture.invalid');insert into platform_operator_assignments values('admin');
 insert into organization_memberships values('00000000-0000-4000-8000-000000000001','admin');
 insert into invoices values('00000000-0000-4000-8000-000000000001',120),('00000000-0000-4000-8000-000000000099',99);
 insert into file_objects values('00000000-0000-4000-8000-000000000001','https://fixture.invalid/private.pdf?sig=private');
 insert into organization_subscriptions values('00000000-0000-4000-8000-000000000001','private-provider-ref',null);`);
 const first=await inventoryTestData(db);assert.equal(first.items.length,2);assert.equal(first.items[0].tenantRows.invoices,1);assert.equal(first.items[1].isDemo,true);
 assert.deepEqual(first.retained,{appUsers:1,operatorAssignments:1});assert.equal(first.items[0].externalFiles.count,1);assert.equal(first.items[0].providerReferences.billing_customer_id,1);
 assert.match(first.manifestSha256,/^[0-9a-f]{64}$/);assert.equal((await inventoryTestData(db)).manifestSha256,first.manifestSha256);
 assert.doesNotMatch(JSON.stringify(first),/private@fixture\.invalid|https:\/\/fixture\.invalid|"total":120|Private test company|private-provider-ref/,'Never expose names, email, business values, URLs or provider identifiers');
 assert.equal((await db.query('select count(*)::int n from invoices')).rows[0].n,2,'Inventory never deletes a business row');
 await db.exec("insert into invoices values('00000000-0000-4000-8000-000000000001',130)");assert.notEqual((await inventoryTestData(db)).manifestSha256,first.manifestSha256,'Changed counts invalidate the reviewed inventory');
 await db.exec('create role reset_inventory_restricted;grant usage on schema public to reset_inventory_restricted;grant select on all tables in schema public to reset_inventory_restricted;alter table invoices enable row level security;alter table invoices force row level security;set role reset_inventory_restricted');
 await assert.rejects(()=>inventoryTestData(db),e=>e.code==='42501','Restricted RLS cannot falsely report zero tenant data');await db.exec('reset role');
 await db.exec("insert into organizations select gen_random_uuid(),'Extra','active',false from generate_series(1,100)");await assert.rejects(()=>inventoryTestData(db),/review bound/);
 const workflow=await fs.readFile('.github/workflows/lifecycle-preflight-diagnostic.yml','utf8');assert.match(workflow,/environment: production/);assert.match(workflow,/github.ref == 'refs\/heads\/main'/);assert.match(workflow,/inputs.approve_readonly == true/);assert.match(workflow,/options: \[ownerless, test-reset\]/);assert.doesNotMatch(workflow,/id-token:|contents: write|db:migrate|db:check|azure\/login|azure\/webapps-deploy/);
 console.log('Read-only reset inventory: all company scopes, dependent counts, private-reference redaction, retained accounts, deterministic manifest, drift, review bounds and RLS denial passed.');
}finally{await db.close();}
