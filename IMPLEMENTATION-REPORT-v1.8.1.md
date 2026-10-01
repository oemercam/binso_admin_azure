# Implementation Report — v1.8.1

## Goal
Close the remaining visible Mobile/PWA gaps against the approved Binso One app mockup without changing desktop behaviour or duplicating business logic.

## Implemented
- PWA standalone splash gate.
- Three-screen mobile introduction followed by the existing three-step company setup.
- Reusable MobileSkeleton, MobileEmptyState, MobileErrorState, MobileOfflineState and MobileFeedback primitives.
- List loading/error/empty states and selection mode.
- Mobile settings profile/menu surface.
- Explicit mockup-completion self-check added to the release test chain.
- New i18n keys translated for DE/EN/FR/IT/TR.

## Unchanged
- Database schema and migrations.
- Auth, tenant isolation, roles/permissions, API guards and audit architecture.
- Desktop shell, navigation and desktop page composition.

## Verification in build workspace
PASS: release/self-check architecture rules that do not require installed project dependencies.
NOT EXECUTED here: full pnpm install, lint, typecheck, audit, db:check, production build and browser screenshot regression. These remain mandatory in the release PowerShell/CI gate.
