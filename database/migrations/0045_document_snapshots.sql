-- Use the existing snapshot columns. Capture template texts on creation and
-- identity/payment details on issue; every write path shares the same trigger.
create or replace function capture_business_document_snapshot() returns trigger
language plpgsql set search_path=public as $$
declare company jsonb; recipient jsonb; incoming jsonb; previous jsonb; content jsonb; invoice boolean;
begin
 invoice := tg_table_name='invoices';
 incoming := to_jsonb(new);
 if tg_op='UPDATE' then
  previous := to_jsonb(old);
  -- Once issued, changes to templates, payments or status cannot rewrite history.
  if old.status<>'draft' and old.document_snapshot ? 'version' then
   new.document_snapshot:=old.document_snapshot;
   new.issuer_snapshot:=old.issuer_snapshot;
   new.customer_snapshot:=old.customer_snapshot;
   if invoice then new.payment_snapshot:=old.payment_snapshot; end if;
   return new;
  end if;
 end if;
 select to_jsonb(o) into company from organizations o where o.id=new.organization_id;
 select jsonb_build_object('name',c.name,'street',c.address,'postal_code',c.zip,'city',c.city,'country',c.country)
 into recipient from customers c where c.id=new.customer_id and c.organization_id=new.organization_id;
 content:=coalesce(incoming->'document_snapshot','{}'::jsonb);
 if not content ? 'version' then
  content:=content || jsonb_build_object('version',1,'captured_at',now(),
   'provenance',case when tg_op='UPDATE' and old.status<>'draft' then 'legacy-current-settings' else 'creation' end,
   'default_intro',coalesce(company->>case when invoice then 'invoice_intro_text' else 'quote_intro_text' end,''),
   'closing',coalesce(company->>case when invoice then 'invoice_footer_text' else 'quote_footer_text' end,''));
 end if;
 new.document_snapshot:=content || jsonb_build_object('intro',coalesce(nullif(new.note,''),nullif(new.intro_text,''),content->>'default_intro',''));
 if new.issuer_snapshot='{}'::jsonb or (tg_op='UPDATE' and old.status='draft' and new.status<>'draft') then
  new.issuer_snapshot:=jsonb_build_object('name',company->>'name','legal_name',company->>'legal_name',
   'street',company->>'street','building_number',company->>'building_number','postal_code',company->>'postal_code',
   'city',company->>'city','country_code',company->>'country_code','email',company->>'email','phone',company->>'phone',
   'website',company->>'website','uid',company->>'uid','vat_number',company->>'vat_number','logo_url',company->>'logo_url');
  new.customer_snapshot:=coalesce(recipient,'{}'::jsonb);
  -- Existing individually stored recipient fields take precedence where present.
  if nullif(new.recipient_address,'') is not null then new.customer_snapshot:=new.customer_snapshot || jsonb_build_object('address_lines',new.recipient_address); end if;
  if nullif(new.recipient_name,'') is not null then new.customer_snapshot:=new.customer_snapshot || jsonb_build_object('contact_name',new.recipient_name); end if;
  if invoice then new.payment_snapshot:=jsonb_build_object('iban',company->>'iban','qr_iban',company->>'qr_iban'); end if;
 end if;
 return new;
end $$;
create trigger invoices_document_snapshot before insert or update on invoices for each row execute function capture_business_document_snapshot();
create trigger quotes_document_snapshot before insert or update on quotes for each row execute function capture_business_document_snapshot();
-- Historical templates cannot be reconstructed. Freeze the available persisted
-- texts/current settings once, explicitly recording legacy provenance. No
-- status, amounts, identifiers, relations or updated_at values are changed.
update invoices set document_snapshot=document_snapshot where not document_snapshot ? 'version';
update quotes set document_snapshot=document_snapshot where not document_snapshot ? 'version';
