import {invoicePaymentRequirements} from './qr-bill';
import {setupFieldIds,type SetupTask} from './action-readiness';
import {safeAppPath} from './navigation';
export const setupSteps=['name','address','bank'] as const;
export type SetupStep=typeof setupSteps[number];
export function setupProcessDestination(step:SetupStep,returnTo='/dashboard'){
 return '/einstellungen/firma?'+new URLSearchParams({setup:'1',returnTo:safeAppPath(returnTo,'/dashboard')})+'#'+({name:setupFieldIds.name,address:setupFieldIds.street,bank:setupFieldIds.iban}[step]);
}
export function setupStepIssues(company:Record<string,unknown>,step:SetupStep){
 const fields=step==='name'?['name','legalName']:step==='address'?['street','postalCode','city','countryCode']:['iban','qrIban'];
 return invoicePaymentRequirements(company).filter(issue=>fields.includes(issue.field));
}
/** Same canonical payment requirements on the server, dashboard and setup form. */
export function requiredSetupTasks(company:Record<string,unknown>,returnTo='/dashboard'):SetupTask[]{
 return setupSteps.map((id,index)=>({id,title:['Unternehmen','Adresse','Zahlungskonto'][index],importance:'required',complete:setupStepIssues(company,id).length===0,href:setupProcessDestination(id,returnTo)}));
}
