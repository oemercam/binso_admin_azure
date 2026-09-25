# Product object model — V44

The product is no longer modelled as a Binso-only ERP.

## Core navigation model

The user can enter through a person/contact and move into the related company.
The company is the business context from which transactions are created.

Flow:

Contact -> Company -> Quote / Order / Contract / Invoice / Time / People

## Canonical ownership

A contact belongs to a company.
Quotes, orders, contracts, invoices, time entries and customer activities belong to the company.
People are linked to the company through assignments on its orders.

## Company 360 view

The existing customer detail route is the company hub.
It keeps the current visual language and exposes:
- contacts
- KPIs
- quick-create actions
- offers
- orders
- contracts
- invoices
- time
- assigned people
- activity

Each business-area link carries the company id as `customer=<id>`, so the target module opens already scoped to that company.

## UX rule

This architecture change must not introduce a new visual system.
Continue to use:
- PageHeader
- canonical compact two-line Mobile/PWA master lists
- existing flat detail sections
- existing KPI geometry
- existing responsive overlays/forms
- existing navigation components

Context reduces input: when an action starts from a company, the company is preselected and must not be asked for again unless the user explicitly changes it.

## SaaS next steps

Multi-tenancy, organization membership, tenant isolation, subscription/billing and persistent database migration are separate backend milestones. V44 establishes the user-facing object model first without destabilising the existing UI.
