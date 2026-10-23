import {requireSession} from '@/lib/server/session';
import {apiError,json} from '@/lib/server/http';
import {currentSensitiveCapabilities} from '@/lib/server/sensitive-access';
export async function GET(){try{const s=await requireSession();return json({capabilities:await currentSensitiveCapabilities(s)});}catch(error){return apiError(error);}}
