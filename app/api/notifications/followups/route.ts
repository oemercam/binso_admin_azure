import {NextRequest} from 'next/server';
import {apiError,assertSameOrigin,json} from '@/lib/server/http';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {checkOfferFollowups} from '@/lib/server/offer-followups';
import {enforceRateLimit} from '@/lib/server/rate-limit';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);await enforceRateLimit(request,'offer-followup-check',30,60_000);const s=await requireSession();
 return json(await withTenant(s.organizationId,s.userId,c=>checkOfferFollowups(c,s)));
}catch(error){return apiError(error);}}
