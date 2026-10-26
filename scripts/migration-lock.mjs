/** Hold a dedicated session lock across ALL migration transactions and checks. */
export async function acquireMigrationLock(pool){
 const client=await pool.connect();
 try{
  await client.query("set lock_timeout='30s'");
  await client.query("select pg_advisory_lock(hashtextextended($1,0))",['binso:canonical:migrations']);
  return async()=>{try{await client.query("select pg_advisory_unlock(hashtextextended($1,0))",['binso:canonical:migrations']);await client.query('reset lock_timeout');client.release();}catch(error){client.release(true);throw error;}};
 }catch(error){client.release(true);throw error;}
}
