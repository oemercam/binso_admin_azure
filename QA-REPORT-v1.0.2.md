# QA v1.0.2

## Aktiv/Inaktiv-Steuerung

Die bisherigen Checkboxen für den Aktivstatus von Benutzern wurden durch einen zentralen Toggle Switch ersetzt.

Betroffen:
- Kundenbereich lokal: Einstellungen → Benutzer und Rollen
- Kundenbereich Production: Tenant-Benutzerverwaltung
- Binso One Betreiberbereich: Operatoren

Technik:
- gemeinsame Komponente `components/ui/toggle-switch.tsx`
- `role="switch"` und `aria-checked`
- Tastaturfokus sichtbar
- Status `Aktiv` / `Inaktiv` wird neben dem Schalter angezeigt
- Styling zentral in `styles/design-system.css`
- Schwarz/Weiss-/Neutraldesign passend zum bestehenden Designsystem

Nicht verändert:
- fachliche Status-Dropdowns wie Kunde `Aktiv/Interessent/Inaktiv`
- Benachrichtigungs-Checkboxen
- Integrationsaktionen `Verbinden/Trennen`

Diese bleiben semantisch andere Steuerelemente.
