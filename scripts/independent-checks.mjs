/** Collect independent evidence sequentially without allowing a failed check to
 * turn green or prevent unrelated checks from exposing their own failures. */
export async function runIndependentChecks(checks){
 const errors=[];
 for(const {name,run} of checks)try{await run();}catch(error){errors.push(new Error(name+' failed',{cause:error}));}
 if(errors.length)throw new AggregateError(errors,'Required browser packages failed: '+errors.map(error=>error.message).join('; '));
}
