import 'server-only';
import {ApiError} from './http';
/** A declared classification is a proposal, never a payroll calculation. */
export function timeClassification(body:Record<string,unknown>,required=false){
 const keys=['timeCategory','isWorkTime','payrollRelevant'];
 if(!required&&keys.every(key=>body[key]===undefined))return null;
 if(typeof body.timeCategory!=='string'||!['work','travel','break','other'].includes(body.timeCategory)||typeof body.isWorkTime!=='boolean'||typeof body.payrollRelevant!=='boolean')throw new ApiError(400,'classification_invalid','Bitte Zeitart, Arbeitszeit und Lohnrelevanz ausdrücklich festlegen.');
 return {category:body.timeCategory,isWorkTime:body.isWorkTime,payrollRelevant:body.payrollRelevant};
}
