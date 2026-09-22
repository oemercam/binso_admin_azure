# Binso Admin v18.10 – Progressive Disclosure

## Standard

The platform no longer exposes editable configuration fields in overview/detail views.

1. Overview/list pages show current values and status only.
2. A row with a chevron opens the relevant editor.
3. True binary settings may be changed directly with a toggle.
4. One to three simple fields use a bottom sheet.
5. Longer forms, document templates and multi-field business objects use a fullscreen editor on mobile/PWA.
6. Creation and edit tasks remain forms only after the user explicitly starts that task.

## Audit

Reviewed application areas:

- Dashboard: navigation/status only; no inline edit form.
- Customers: list first; create/edit only in dedicated editor.
- Employees: compact list first; create/edit only in dedicated editor.
- Orders: compact list and object hub; edit/rules/evidence only after explicit action.
- Quotes: list/preview first; document fields only inside create/edit flow.
- Invoices: list/preview first; document fields only inside create/edit/payment/send flows.
- Time: operational list; entry fields only after explicit create action.
- Accounting: task/list overview; supplier invoice fields only after explicit create action.
- Finance: overview only; no exposed inline configuration form.
- Settings: converted to progressive rows. Text, number, addresses, templates, theme and push configuration open dedicated sheets/editors. Binary options remain direct toggles.

## Central components

- `components/settings/settings-row.tsx`
  - `SettingsValueRow`
  - `SettingsToggleRow`
  - `SettingsSection`
- `components/ui/sheet-system.tsx`
  - `AppSheet`
  - `SheetHeader`
  - `SheetFooter`
  - `SheetActions`
- `app/progressive-settings-v18-10.css`

This keeps read views calm and prevents forms from becoming the default visual state.
