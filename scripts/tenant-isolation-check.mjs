import pg from "pg";

const url=process.env.DATABASE_URL;
if(!url)throw new Error("DATABASE_URL is required");
const pool=new pg.Pool({
  connectionString:url,
  ssl:process.env.DATABASE_SSL==="false"?undefined:{rejectUnauthorized:process.env.DATABASE_SSL_REJECT_UNAUTHORIZED!=="false"}
});

const rlsTables=[
  "customers","customer_contacts","quotes","quote_lines","orders","time_entries","invoices","invoice_lines",
  "invoice_line_time_entries","payments","employees","contracts","contract_lines","suppliers","supplier_invoices",
  "expenses","credit_notes","customer_activities","projects","products_services","tasks","absences","accounting_entries",
  "bank_transactions","vat_periods","payroll_runs","business_documents","entity_notes","entity_file_links","file_objects",
  "support_cases","support_messages","in_app_notifications","product_feedback","notification_preferences","organization_feature_flags"
];
const forceTables=[
  "customers","customer_contacts","quotes","quote_lines","orders","time_entries","invoices","invoice_lines",
  "invoice_line_time_entries","payments","employees","contracts","contract_lines","suppliers","supplier_invoices",
  "expenses","credit_notes","customer_activities","projects","products_services","tasks","absences","accounting_entries",
  "bank_transactions","vat_periods","payroll_runs","business_documents","entity_notes","entity_file_links"
];

try{
  const r=await pool.query(
    `select c.relname,c.relrowsecurity,c.relforcerowsecurity
       from pg_class c
      where c.relnamespace='public'::regnamespace and c.relname=any($1::text[])
      order by c.relname`,
    [rlsTables]
  );
  const found=new Map(r.rows.map(row=>[row.relname,row]));
  const missing=rlsTables.filter(table=>!found.has(table));
  if(missing.length)throw new Error(`Tenant tables missing: ${missing.join(", ")}`);
  const rlsBad=rlsTables.filter(table=>!found.get(table)?.relrowsecurity);
  if(rlsBad.length)throw new Error(`RLS missing: ${rlsBad.join(", ")}`);
  const forceBad=forceTables.filter(table=>!found.get(table)?.relforcerowsecurity);
  if(forceBad.length)throw new Error(`FORCE RLS missing: ${forceBad.join(", ")}`);

  const policies=await pool.query(
    `select tablename,count(*)::int as count
       from pg_policies
      where schemaname='public' and tablename=any($1::text[])
      group by tablename`,
    [rlsTables]
  );
  const policyCount=new Map(policies.rows.map(row=>[row.tablename,Number(row.count)]));
  const noPolicy=rlsTables.filter(table=>(policyCount.get(table)||0)<1);
  if(noPolicy.length)throw new Error(`Tenant policy missing: ${noPolicy.join(", ")}`);
  console.log(`Tenant isolation schema check passed (${rlsTables.length} RLS tables, ${forceTables.length} FORCE RLS business tables).`);
}finally{
  await pool.end();
}
