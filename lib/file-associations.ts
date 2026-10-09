import type {TenantPermission} from '@/lib/permissions';
/** All entity attachments use the same upload, storage and download path. */
export const fileRelations:Record<string,{table:string;column:string;filter:string;read:TenantPermission;write:TenantPermission}>={
 expense_receipt:{table:'expenses',column:'expense_id',filter:'expenseId',read:'expenses:read',write:'expenses:write'},
 support_attachment:{table:'support_cases',column:'support_case_id',filter:'ticketId',read:'support:read',write:'support:write'},
 employee_document:{table:'employees',column:'employee_id',filter:'employeeId',read:'employees:read',write:'employees:write'},
 customer_document:{table:'customers',column:'customer_id',filter:'customerId',read:'customers:read',write:'customers:write'},
 invoice_attachment:{table:'invoices',column:'invoice_id',filter:'invoiceId',read:'invoices:read',write:'invoices:write'},
 offer_attachment:{table:'quotes',column:'quote_id',filter:'offerId',read:'sales:read',write:'sales:write'},
 project_document:{table:'projects',column:'project_id',filter:'projectId',read:'projects:read',write:'projects:write'},
};
