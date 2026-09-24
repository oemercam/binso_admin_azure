# Subscriptions and entitlements

Subscription plan, entitlements, tenant status, user permission and feature flags are separate controls. Existing `canTenantAction` remains the central runtime access decision for tenant work. V73 adds storage for explicit entitlement overrides but does not use feature flags as authorization.
