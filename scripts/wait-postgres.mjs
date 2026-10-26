import pg from 'pg';
const deadline=Date.now()+90000;
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL required');
for(;;){
 const client=new pg.Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:true},connectionTimeoutMillis:3000});
 try{await client.connect();await client.query('select 1');console.log('Verified PostgreSQL connection is ready.');break;}
 catch{if(Date.now()>=deadline)throw Error('PostgreSQL did not become reachable through the scoped runner rule.');}
 finally{await client.end().catch(()=>{});}
 await new Promise(resolve=>setTimeout(resolve,5000));
}
