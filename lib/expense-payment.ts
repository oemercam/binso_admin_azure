/** Payment source is independent of review, customer billing and actual reimbursement. */
export const expensePaymentKinds = ['unknown', 'private', 'company_card', 'company_direct'] as const;
export type ExpensePaymentKind = typeof expensePaymentKinds[number];
export function isExpensePaymentKind(value: unknown): value is ExpensePaymentKind {
  return typeof value === 'string' && expensePaymentKinds.some(kind => kind === value);
}
export function expenseClaimStatus(paymentKind: unknown, status: unknown, reimbursedAt: unknown) {
  if (reimbursedAt) return 'reimbursed';
  if (paymentKind === 'company_card' || paymentKind === 'company_direct') return 'not_applicable';
  if (paymentKind !== 'private') return 'unresolved';
  if (status === 'rejected') return 'rejected';
  return status === 'approved' || status === 'posted' ? 'eligible' : 'pending_review';
}
