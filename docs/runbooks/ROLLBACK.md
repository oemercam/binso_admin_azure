# Rollback Runbook
Code rollback and DB rollback are separate. Prefer Azure slot rollback/swap for bad code when safe. Never blindly reverse DB migrations if data loss is possible; use expand/migrate/contract and roll-forward where appropriate.
