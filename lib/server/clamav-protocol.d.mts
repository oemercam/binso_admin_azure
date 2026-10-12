export type ScanEvidence={engine:'ClamAV';engineVersion:string;signaturesVersion:number;signaturesAt:string;sha256:string;startedAt:string;completedAt:string};
export function scanBytes(body:Buffer,options:{socketPath:string;maxBytes?:number;timeoutMs?:number}):Promise<{status:'clean'|'rejected';evidence:ScanEvidence}>;
export function scannerVersion(options:{socketPath:string;deadline:number;maxSignatureAgeMs?:number}):Promise<Omit<ScanEvidence,'sha256'|'startedAt'|'completedAt'>>;
