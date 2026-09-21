# Binso Admin v5 Demo Workflow

Binso Admin v5 extends the v4 UI with a connected demo business workflow for customers, quotes, orders, time entries, invoices, payments and supplier costs.

## Important: persistence

This demo does **not** use Azure PostgreSQL yet. Changes are stored in the browser via `localStorage` under `binso-admin-demo-v5`. This is intentionally a test layer so the complete workflow can be validated before the production database is introduced.

Do not use the local demo store for real customer, employee, invoice or financial data.

## Demo scenario

All names other than Binso GmbH are fictional demo data.

- `Alpine Public IT AG` is the contractual customer / prime contractor and has won a fictional WTO Digital Workplace procurement.
- Binso performs the mandate `WTO Digital Workplace – Mandat Binso` for the fictional end customer `Bundesstelle Digital Services (Demo)`.
- Ömer Cam performs internal consulting work.
- Nina Keller is represented as an employee paid by the hour.
- Dario Meier / `Meier Cloud Consulting GmbH` is an external company delivering work on the same mandate and invoicing Binso.
- External supplier costs are visible in Accounting and linked to the same order.

## Testable flows

1. Create a customer. The customer remains available after page navigation/reload in the same browser.
2. Record time against an order and identify whether the service comes from an internal employee, hourly employee or external company.
3. Select open billable time entries in Time Tracking and create an invoice directly from them.
4. Alternatively open Invoices, choose an order, select open time entries and create a draft invoice.
5. Invoice preview shows each selected time entry as an invoice line with quantity, rate, VAT and totals.
6. Time entries used for an invoice are marked as invoiced and cannot be selected again.
7. Record full or partial payments. Invoice status becomes partially paid or paid.
8. Mark an offer as accepted and create an order from the accepted offer.
9. Accounting shows receivables, payables and the external supplier invoice linked to the WTO mandate.

## Next production step

Replace `components/state/business-store.tsx` with server-side repositories backed by Azure Database for PostgreSQL. The existing domain model is already split into customers, suppliers, quotes, orders, time entries, invoices, invoice lines, payments and supplier invoices so the UI workflow can remain largely unchanged.
