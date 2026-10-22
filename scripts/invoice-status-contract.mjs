import assert from 'node:assert/strict';

/** Same canonical projections on JavaScript, real SQL and local list filters. */
export async function verifyInvoiceStatuses({financial,expressions,query}){
 const today='2026-10-22',base={kind:'invoice',status:'sent',total:100,paid_amount:0,credit_amount:0,refund_amount:0,due_date:'2026-10-23'};
 const cases=[
  [{status:'draft'},'draft',null,null],
  [{status:'cancelled'},'cancelled',null,null],
  [{},'open','unpaid','not_due'],
  [{due_date:today},'open','unpaid','due_today'],
  [{due_date:'2026-10-21'},'overdue','unpaid','overdue'],
  [{paid_amount:30},'partial','partial','not_due'],
  [{paid_amount:30,due_date:'2026-10-21'},'overdue','partial','overdue'],
  [{paid_amount:100,status:'paid',due_date:'2026-10-21'},'paid','paid',null],
  [{paid_amount:110,status:'paid'},'overpaid','overpaid',null],
  [{paid_amount:110,refund_amount:10,status:'paid'},'paid','paid',null],
  [{credit_amount:100},'credited','credited',null],
  [{credit_amount:20,paid_amount:95},'overpaid','overpaid',null],
  [{credit_amount:20,paid_amount:95,refund_amount:15},'paid','paid',null],
  [{total:0.3,paid_amount:0.1},'partial','partial','not_due'],
  [{due_date:null},'open','unpaid','unknown'],
 ];
 for(const [overrides,display,payment,due] of cases){
  const item={...base,...overrides},axes=financial.invoiceStatusAxes(item,today);
  assert.equal(financial.financialStatus(item,today),display);assert.equal(axes.payment,payment);assert.equal(axes.due,due);
  const actual=(await query(`select ${expressions.invoicePaymentStatusSql('d')} payment_status,${expressions.invoiceDueStatusSql('d','$7')} due_status,${expressions.invoiceDisplayStatusSql('d','$7')} display_status from (select $1::text status,$2::numeric total,$3::numeric paid_amount,$4::numeric credit_amount,$5::numeric refund_amount,$6::text due_date) d`,[item.status,item.total,item.paid_amount,item.credit_amount,item.refund_amount,item.due_date,today])).rows[0];
  assert.deepEqual(actual,{payment_status:payment,due_status:due,display_status:display},'SQL and JavaScript must agree before pagination: '+JSON.stringify(overrides));
 }
 const partialOverdue={...base,paid_amount:30,due_date:'2000-01-01'};
 assert.equal(financial.documentMatchesFilter(partialOverdue,'Teilweise bezahlt'),true);assert.equal(financial.documentMatchesFilter(partialOverdue,'Überfällig'),true);assert.equal(financial.documentMatchesFilter(partialOverdue,'Bezahlt'),false);
 assert.equal(financial.documentMatchesFilter({...partialOverdue,paid_amount:0},'Teilweise bezahlt'),false,'An unpaid overdue invoice cannot masquerade as partially paid');
 assert.equal(financial.documentMatchesFilter({...base,paid_amount:110},'Überbezahlt'),true);
 assert.deepEqual(financial.documentFilterQuery('invoice','Teilweise bezahlt'),{field:'payment_status',value:'partial'});assert.deepEqual(financial.documentFilterQuery('invoice','Heute fällig'),{field:'due_status',value:'due_today'});
 assert.equal(financial.documentFilterQuery('invoice','foreign input'),null);assert.equal(financial.documentMatchesFilter(base,'Alle'),undefined,'The common records owner retains its ordinary all/type/query behavior');
 assert.equal(financial.financialStatusText('cancelled','offer'),'Zurückgezogen');assert.equal(financial.financialStatusText('cancelled','invoice'),'Storniert');
 assert.equal(new Set(financial.documentFilters('invoice')).size,financial.documentFilters('invoice').length);
 for(const state of ['Teilweise bezahlt','Heute fällig','Überbezahlt','Gutgeschrieben'])assert.ok(financial.documentFilters('invoice').includes(state));
 assert.ok(financial.documentFilters('offer').includes('Zurückgezogen'));assert.ok(!financial.documentFilters('offer').includes('Storniert'));
 assert.equal(financial.invoiceStatusAxes({...base,status:'unrecognized'}).document,'unknown');assert.equal(financial.invoiceStatusAxes({...base,due_date:'2026-02-30'}).due,'unknown');
 for(const name of ['invoicePaymentStatusSql','invoiceDueStatusSql','invoiceDisplayStatusSql','invoiceCreditSql','invoiceRefundSql'])assert.throws(()=>expressions[name]('d; drop table invoices','$1'),/Invalid internal/);
 assert.throws(()=>expressions.invoiceDueStatusSql('d','$1 or true'),/Invalid internal/);
 console.log('Independent invoice axes: partial + overdue, today, paid, actual overpayment/refund, full credit, missing/invalid dates, exact SQL/JS parity, local/remote filter semantics and internal SQL-identifier rejection passed.');
}
