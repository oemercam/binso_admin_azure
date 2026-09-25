# Page header standard — V24

Every application page uses the same header hierarchy:

1. Page title
2. Short functional description
3. Optional page action

Not permitted above the title:
- role labels such as `Inhaber`
- module/category labels such as `CRM`, `Verkauf`, `Team`, `Leistung`
- internal project, organisation or process abbreviations
- decorative eyebrow text

Descriptions must explain briefly what the user can do on the page and should remain neutral and understandable.

This rule is enforced centrally by `PageHeader`, which no longer exposes an `eyebrow` property.
