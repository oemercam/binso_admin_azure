# V21.1 Central UI Foundation

Baseline: `1eef9fb1d005d4752f12a9dd5c0e620decca4444` (PR #227 already integrated). No merge/deployment of V21.1 is authorized yet. The customer and operator bottom navigation are frozen against that baseline, including inherited tokens and icons.

## Ownership and imports

Import the actual owner, not the compatibility `components/app-pages` barrel. Keep business fetching, validation, permissions and mutation handlers in the domain page. Reuse these existing responsibilities; the template names do not introduce a second component library.

| Page responsibility | Canonical composition | Scrolling / state ownership |
| --- | --- | --- |
| DashboardPage | AppShellFrame + PageHeading + MetricTiles/MetricTile + domain dashboard | Existing shell stays mounted; local data states |
| ListPage | PageHeading/CreateAction + RecordsView + RecordRow/ListRow | RecordsView owns search/chips/count/sort; responsive list/table variants |
| DetailPage | DetailHeading + DetailTabs + ActionsMenu/ActionSheet | Existing fixed header and local tabs; one status/action context |
| CreatePage | PageHeading + Field/control + FormActions; FormWizard for guided steps | Existing form display/navigation states; dirty guard, scoped scroll |
| EditPage | Same controls + existing FormSheet where appropriate | Preserve draft state and discard confirmation |
| SettingsPage | Existing settings detail grid + Field/control in edit FormSheet | Existing settings layout and permissions |
| ChatPage | Existing thread layout/composer + MessageBubble | Only message pane scrolls; preserve message visibility/direction |
| DocumentViewerPage | Existing DocumentModal + DocumentPageViewer | One actual PDF canvas page; internal zoom and real page count |

`components/ui.tsx` owns Input, Select, Textarea, DateInput, TimeInput, CurrencyInput, Checkbox, Toggle (Switch responsibility), Field, FormLabel, FormError, FormActions, LoadingState, ErrorState, EmptyState, Toast, Status and MessageBubble. Do not build parallel native controls. Field preserves explicit accessible names/descriptions, associates its hint/error and disables controls under the existing read-only page context. DateInput retains the native date keyboard; CurrencyInput retains decimal inputMode; TimeInput retains the approved text HH:MM editor.

`components/records.tsx` owns DataTable/DataTableHead/DataTableRow and RecordsView. Records/operator variants retain their existing domain columns and styles. Sorting/filtering/pagination must remain in the existing business owner; V21.1 does not invent new pagination behavior.

`components/binso-ux.tsx` owns headings, tabs, list rows, ActionRow and Action/Form/FilterSheet. Selection uses existing Select or FormSheet. WizardSheet uses FormSheet + FormWizard. Existing HeaderPanel owns search/notifications/account under the header. `useDialogFocus` remains the single focus/scroll/viewport manager. ConfirmDialog portals into body and uses this manager. Existing protected AppShell navigation-owned overlays remain an explicit migration boundary.

Permission notices and domain-specific success/read-only states retain their existing permission/business logic. Reuse ErrorState/LoadingState for ordinary data failure/loading. Do not replace access checks with cosmetic loading components.

## Tokens and CSS

The six ordered unlayered stylesheets stay authoritative: tokens, base, marketing, app, operator, responsive. Reuse `--control-h`, `--control-font`, `--control-radius`, `--control-x`, `--field-label-gap`, typography/status/overlay/safe-area tokens. Control height remains 40 px desktop / 44 px mobile. Textarea min-height and disabled opacity now have central tokens. Identical light/dark control border values use `--control-border`. Existing bottom-navigation transitive tokens are unchanged.

Remove obsolete declarations in their owner. Do not append specificity fixes to override known contradictions. Repeated selectors are audit candidates: different responsive contexts, focus/disabled states and progressive fallbacks can be intentional. `css-contract.mjs` rejects identical declaration copies in the same selector/context while preserving different-valued fallbacks. Frozen chrome is excluded from this cleanup guard and tested independently.

## Technical checks

- ESLint `binso-ui/central-components` blocks native controls outside the named canonical renderers, copied canonical wrappers, direct legacy page-barrel imports and copied simple loading/error paragraphs. Narrow native exceptions: ListSearch, SearchPanel, RecordsView's compact sort and PrivacyConsent checkbox. The guard does not prove that arbitrary dynamic class generators or all future custom markup conform visually.
- `pnpm ui:check`: executable lint fixtures, actual SSR field/state/message variants, read-only/ARIA checks, CSS fallback/context tests, inventory separation and extended frozen-navigation contract.
- `pnpm css:check`, `pnpm ux:inventory`: full static route/component/import/prop/class/media/declaration catalogs. Static render graphs include conditional candidates; they do not prove a branch was rendered.
- `/dev/ux-lab`: development-only, synthetic, no API calls. Covers central controls/validation/read-only, buttons/status/avatar/list/table, sheets/wizard/top-panels, loading/error/toast, messages and local PDF. Production route remains notFound.
- FAST: touched-file lint, targeted unit/DOM checks. INTEGRATION: typecheck/build, relevant browser/interactions. RELEASE: all existing Quality/security/business/PWA gates. No gate is removed or disabled.

Physical installed iOS/Android PWA and real keyboard behavior need device acceptance. Browser emulation and synthetic API fixtures must be labelled as such.
