# Operator Portal

The operator portal is an internal Binso control surface, not a customer tenant. Operator access is limited by Entra app roles and the Binso identity boundary. Navigation: Overview, Customers, Subscriptions, Registrations, Support, Operations, Audit and Settings.

Critical mutations require server-side role checks. Feature flag changes require a reason and create a platform audit event. Support actions are separated from customer-visible messages and existing temporary support-access grants.
