export function validateEvidenceRun(run,expectedSha){
 if(!/^[a-f0-9]{40}$/.test(expectedSha)||run.head_sha!==expectedSha||run.head_branch!=='main'||run.status!=='completed'||run.conclusion!=='success')throw Error('Evidence must come from a successful completed main run for the exact immutable source SHA');
}
