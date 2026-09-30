# Binso One v1.4.0

## UI foundation cleanup

- CSS entrypoints consolidated to four central stylesheets: tokens, application, responsive and overlays.
- Removed version-specific CSS layers and obsolete stylesheet files.
- Rebuilt the overlay/dialog/bottom-sheet system around one portal-based `ResponsiveOverlay` component.
- Standardized safe-area handling, scroll locking, focus trapping, ESC/backdrop closing and mobile sheet geometry.
- Standardized two-button action rows so back/cancel and continue/save actions have equal width on mobile/PWA.
- Migrated search, more navigation, confirmations, privacy settings, document preview, document send, payroll preview and edit dialogs to the shared overlay component.
- Fixed the pricing carousel so initial centering never scrolls the whole page vertically; swipe indicator now follows the active plan.
- Removed whole-page marketing reveal and explicit route-level scroll reset; section reveal remains opt-in only.
- Centralized mobile/PWA page gutters, header offsets, bottom navigation spacing and safe areas.
- Standardized mobile relationship/filter popover placement above the bottom navigation.
- Added stronger architecture and overlay self-checks to prevent reintroduction of legacy CSS layers and legacy modal markup.
- Bumped PWA cache generation so installed apps receive the new UI foundation.
- Migrated shared navigation and authentication-security surfaces to explicit locale translation calls; legacy screens keep the translation compatibility bridge until their gradual key migration is complete.
- Added `QA-REPORT-v1.4.0.md` documenting static validation and the required local production verification pipeline.
