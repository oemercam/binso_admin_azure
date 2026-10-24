/** Review state is distinct from billing/assignment classifications and actions. */
export function timeEntryStatus(entry:{invoiced_invoice_id?:string|null;approved?:boolean;submitted_at?:string|null;review_note?:string|null}){
 if(entry.invoiced_invoice_id)return 'Verrechnet';
 if(entry.approved)return 'Freigegeben';
 if(entry.submitted_at)return 'Eingereicht';
 if(entry.review_note?.trim())return 'Zurückgewiesen';
 return 'Erfasst';
}
