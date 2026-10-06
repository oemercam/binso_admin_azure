# Binso One: Desktop und Prozessabgleich — 6. Oktober 2026

## Ergebnis und Umfang

Basis: main e4061dfa (PR 181). Bestehende Modulübersichten und Einstellungen wurden im Browser geöffnet; Quellcode, Routen, Datenmodelle und Übergänge wurden abgeglichen. Das ist keine vollständige Live-Funktionsabnahme: Registrierungs-E-Mails, MFA-Anmeldung, echte Zahlungen, Operator-Zugriffe sowie alle Rollen und Fenstergrössen wurden in dieser Prüfung nicht end-to-end ausgeführt. Die Browseransichten zeigen zunächst Ladezustände; die Kundenliste war nach dem Laden mit drei Datensätzen verfügbar. Direkte Änderungen an produktiven Geschäftsdaten wurden nicht vorgenommen.

## Verbindlicher Desktop-Aufbau

- Navigation: Start; Verkauf (Kunden, Angebote, Rechnungen, Produkte); Arbeit & Team (Zeiterfassung, Mitarbeiter); Finanzen (Zahlungen, Spesen, Finanzen). Support und Einstellungen bleiben dauerhaft erreichbar.
- Übersichten: eine Datenzeile je Eintrag, direkte Suche, fachliche Statusfilter, sortierbare Spalten, Trefferzahl. Suchbegriff, Status und Sortierung bleiben innerhalb der Browsersitzung beim Wechsel zur Detailseite erhalten.
- Details: Kontext links, Arbeitsinhalt in der Mitte, passende Aktionen rechts. Schmale Fenster stapeln diese Bereiche über bestehende Breakpoints.
- Neue Datensätze: fokussiertes Formular; keine drei künstlich leeren Spalten. Herkunft wird übernommen: Kunde → Dokument; Rechnung → Zahlung; Mitarbeiter → Zeiten/Spesen.
- Aktionen folgen Zustand und Berechtigung. Gesperrte Belege sind nicht editierbar; Entwürfe und abgeschlossene Rechnungen bieten keine Zahlungserfassung. Nicht implementierter Versand darf keine Erfolgsmeldung auslösen.
- Hell/Dunkel verwenden die vorhandenen zentralen Farben. Feine Trennlinien und kompakte Texte, keine neuen Kartenflächen.

## Fachlicher Abgleich

| Bereich | Vorhandener Ablauf | Korrektur in diesem Stand | Noch offen |
|---|---|---|---|
| Start | Kennzahlen, letzte Belege/Zahlungen, Schnellzugriff | Navigation nach Arbeitsbereichen | Priorisierte Arbeitsliste für Überfälliges, Freigaben und unverrechnete Leistungen |
| Kunden/Kontakte | Kundenliste, Stammdaten, Kontakte, Belege, Aktivität | Kunde in neue Angebote/Rechnungen übernehmen; Ladefehler anzeigen; störende Escape-Zeichen entfernen | Kontakt bearbeiten/löschen/Hauptkontakt ändern; vollständiger fachlicher Verlauf |
| Angebote | Entwurf, Vorschau, Übernahme in Rechnung | Kundenzuordnung übernehmen; gesperrte Dokumente respektieren | Echter Versand, Annahme/Ablehnung im Kundenprozess, Versionen; Auftrag als eigenes Modul |
| Rechnungen | Positionen, QR-Vorschau, Zeitübernahme, Zahlung | Rechnung an Zahlungserfassung übergeben; Bearbeitung nach Status sperren; unterschiedliche Stundensätze getrennt übernehmen | Entwurf → ausgestellte Rechnung als vollständiger sichtbarer Übergang; Mahnen, Storno/Gutschrift und echter Versand |
| Zahlungen | Rechnung wählen, Restbetrag, idempotente Buchung | Herkunftsrechnung und Restbetrag vorwählen, Doppelklick sperren, danach zur Rechnung zurückkehren | Bankimport/Abgleich und vollständiger Stornoprozess |
| Zeitmessung | Start, Pause, Fortsetzen, Stoppen | Direktkunden dauerhaft speichern; beim Stoppen erhalten; Kontextwechsel mit erfasster Zeit sperren; Wiederabgleich nach Fokus/30 Sekunden | Tätigkeit/Verrechenbarkeit/Stundensatz explizit steuerbar; Tageswechselregel festlegen |
| Zeiteinträge | Kunde/Projekt, Mitarbeiter, Freigabe, Rechnung | Mitarbeiterfilter, Statusfilter, Datum, gefilterte Summe; nur ein Kunde je Rechnung; Aktionen nach Rolle; Fehler/Laden unterscheiden | Zeitraum/Suche, Korrekturprozess, Nachtragen für andere Mitarbeiter; Position zu bestehendem Rechnungsentwurf hinzufügen |
| Mitarbeiter | Stammdaten, Zeit-/Spesen-/Dokumentregister | Mitarbeiterkontext in Zeiterfassung und neue Spese übernehmen | Konto und Personalstamm explizit verknüpfen statt E-Mail-Zuordnung; Abwesenheiten und Lohnoberfläche |
| Produkte/Leistungen | Typ, Einheit, Preis, MWST, Status | Gemeinsame Sortierung und Listenfilter | Auswahl aus Produktstamm im Dokumenteditor vollständig abgleichen |
| Spesen | Erfassen, Beleg erkennen/hochladen, Status | Mitarbeiter vorauswählen; Ladefehler anzeigen | Fachliche Freigaberollen, Erstattung und Weiterverrechnung; bestehende Belege anzeigen |
| Finanzen | Einnahmen/Kosten/Personal, fixe und freie Zeiträume | Bestehende Zeitraumstruktur beibehalten | Einträge hinter jeder Zahl öffnen; MWST-Abrechnung, Lohnfreigabe und Berichte als eigene Oberflächen |
| Belegübersicht | Angebote/Rechnungen/Zahlungen gemeinsam | Fachliche Routenberechtigung ergänzen | Statusübergreifende Aufgabenansicht statt zusätzlicher Erfassungswege |
| Support | Ticketliste, Erfassung, Unterhaltung | Gemeinsame Listenlogik | Ladefehler auf allen Listen/Details sichtbar machen; Rechte/Operator-Übergabe live abnehmen |
| Benachrichtigungen | gelesen/ungelesen, Zielverknüpfung | Vorhandene direkte Ziele beibehalten | Keine unbelegten Push-Zusagen; Zustellung und Zielrechte testen |
| Konto/Firma/Dokumente | Profil, Logo, Zahlungsangaben, Standardtexte | Kundenzuordnung mit kanonischer ID beim Speichern | Alle Standardwerte im Erstellprozess prüfen; Formular während Laden/Fehler sperren |
| Benutzer/Rollen | Einladungen, Rollen, Plätze | Routenalias Angebote/Zeit/Mitarbeiter/Belege den fachlichen Rechten zuordnen | Navigation und alle Formularaktionen vollständig nach Rolle/Plan filtern; Personal ≠ Benutzerkonto |
| Sprache/Darstellung | Sprachwahl, zentraler Theme-Resolver | Keine neue Theme-Verwaltung | Vollständige DE/FR/IT/EN/TR-Texte: Sprachwahl allein übersetzt die Oberfläche noch nicht |
| Sicherheit/Datenschutz/Abo | MFA/Sitzungen, Cookies, Stripe-Checkout/Portal | Bestehende getrennte Kontoprozesse beibehalten | Live-Abnahme echter Anmeldung, MFA, E-Mail, Abo ohne kostenpflichtigen Abschluss |
| Operator | Dashboard, Tickets, Kunden, Zahlungen, Finanzen, Abos, Sperren, Monitoring, Ankündigungen, Sicherheit, Audit | Bestehende separate Gruppierung beibehalten | Einheitliche Lade-/Fehler-/Leerdarstellung und vollständige Rollenabnahme; in dieser Runde keine Operator-Anmeldung |

## Prozessregeln

1. Kunde → Angebot → Rechnung → Zahlung ist heute der vorhandene Verkaufspfad. Aufträge sind Datenmodell/Planung, haben aber keine eigene App-Seite. Eine direkte Rechnung ohne Angebot bleibt möglich.
2. Zeit → Prüfung → Freigabe → Rechnung: nur freigegebene, unverrechnete Kundenzeiten. Der Server verknüpft Rechnung und Zeiten atomar und verhindert Doppelverrechnung. Gemischte Kunden werden vor der Rechnungserstellung blockiert. Unterschiedliche Stundensätze ergeben getrennte Positionen.
3. Laufende oder pausierte Zeit mit Aufwand muss zuerst gespeichert werden, bevor Kunde/Projekt geändert wird. Interne Zeit ohne Kunden ist nicht automatisch verrechenbar. Direktkundentätigkeit benötigt kein Projekt.
4. Mitarbeiterstammdaten und Anmeldebenutzer sind verschiedene Datensätze. Stammdaten allein erzeugen keinen Login; Benutzerrechte werden über Benutzer & Rollen vergeben.
5. Eine Spese ist weder automatisch erstattet noch weiterverrechnet, nur weil sie genehmigt wurde. Diese Folgeschritte fehlen noch und dürfen nicht als vorhanden gelten.
6. Zahlungsbuchung ist idempotent; Teilzahlung verändert den offenen Betrag. Keine Zahlung für Entwürfe, bezahlte oder stornierte Rechnungen anbieten.

## Nicht vorhandene Moduloberflächen

Der Katalog `lib/modules.ts` enthält weitergehende Module, deren Seiten im aktuellen App-Routenbaum fehlen: Aufträge, Projekte als eigenes Verwaltungsmodul, MWST, Lohn, Berichte, Lieferanten, Eingangsrechnungen, Buchhaltung, Bank, Aufgaben, Abwesenheiten, Dokumentenablage und Verträge. Das Projektmodell ist über die API und Zeiterfassung nutzbar. Katalogeinträge sind kein Nachweis fertiger Prozesse. Alte Katalogpfade `/offerten`, `/zeiterfassung` und `/personal` sind zudem nicht die aktuellen UI-Routen `/angebote`, `/zeit` und `/mitarbeiter`.

## Reihenfolge bis zur finalen Abnahme

1. Die hier korrigierten vorhandenen Übergänge und Layoutregeln zusammen mit dem separaten Desktop-Layout-PR prüfen.
2. Dokumentstatus und Versand fertigstellen; keine scheinbaren Erfolgsmeldungen.
3. Mitarbeiter/Benutzer, Zeitprüfung, Stundensätze und Spesenfreigaben vollständig definieren und umsetzen.
4. Fehlende vereinbarte Module ergänzen; Preis-/Funktionsversprechen mit tatsächlich vorhandenen Funktionen abgleichen.
5. Rollen/Pläne, alle Sprachen und komplette Kundenreise live testen.
6. Desktop bei breitem, halbiertem und schmalem Fenster sowie Tablet/PWA visuell abnehmen. Erst danach als final bezeichnen.

## Validierung

Vorhandene Tests, Lint, TypeScript und Produktionsbuild werden ausgeführt. Der Migrationstest prüft die tatsächlichen Timer-Handler gegen die migrierte PostgreSQL-Testdatenbank: Direktkunde ohne Projekt, Reload, Pause, Stoppen, verbotener Kontextwechsel, interne Zeit und ungültiger Kunde. Die neue Migration fügt nur eine nullable Kundenspalte mit Tenant-Fremdschlüssel hinzu und übernimmt vorhandene Projektkunden; keine Löschung. Der CSS-Check erkennt künftig wörtliche Newline-Escapes.

## Vollständiges Seiteninventar

Alle folgenden Routen wurden auf ihren zugeordneten Quellcode bzw. ihre Weiterleitung abgeglichen. Das Inventar bedeutet keine erfolgreiche Live-Funktionsabnahme jeder Route.

| Route | Implementierung / Zuständigkeit |
|---|---|
| `/agb` | `import type {Metadata} from "next";; import Link from "next/link";; import {LegalPage} from "@/components/legal-page";; import {legalConfig} from "@/config/legal";` |
| `/angebote/[id]` | `import { OfferEditor } from "@/components/app-pages";` |
| `/angebote/neu` | `import { OfferEditor } from "@/components/app-pages";` |
| `/angebote` | `import { SimpleModule } from "@/components/app-pages";` |
| `/auftragsbearbeitung` | `import type {Metadata} from "next";; import Link from "next/link";; import {LegalPage} from "@/components/legal-page";; import {legalConfig} from "@/config/legal";` |
| `/belege` | `import { DocumentsHubPage } from "@/components/app-pages";` |
| `/benachrichtigungen` | `import { NotificationsPage } from "@/components/app-pages";` |
| `/dashboard` | `import { DashboardPage } from "@/components/app-pages";` |
| `/datenschutz` | `import type {Metadata} from "next";; import Link from "next/link";; import {LegalPage} from "@/components/legal-page";; import {legalConfig} from "@/config/legal";` |
| `/demo` | `import { useEffect, useState } from "react";; import { startDemoClientSession } from "@/lib/client/backend";; import { Logo } from "@/components/ui";` |
| `/einstellungen/abonnement` | `import { SubscriptionSettingsPage } from "@/components/app-pages";` |
| `/einstellungen/benachrichtigungen` | `import { NotificationSettingsPage } from "@/components/app-pages";` |
| `/einstellungen/darstellung` | `import { AppearanceSettingsPage } from "@/components/app-pages";` |
| `/einstellungen/datenschutz` | `import {PrivacySettingsPage} from "@/components/privacy-consent";` |
| `/einstellungen/dokumente` | `import {DocumentSettingsPage} from "@/components/document-settings";` |
| `/einstellungen/firma` | `import { CompanySettingsPage } from "@/components/app-pages";` |
| `/einstellungen/konto` | `import { AccountSettingsPage } from "@/components/app-pages";` |
| `/einstellungen` | `import { SimpleModule } from "@/components/app-pages";` |
| `/einstellungen/sicherheit` | `import {SecuritySettingsPage} from "@/components/security-settings-page";` |
| `/einstellungen/sprache` | `import { LanguageSettingsPage } from "@/components/app-pages";` |
| `/einstellungen/team` | `import { TeamSettingsPage } from "@/components/team-settings";` |
| `/email-bestaetigen` | `import { useEffect, useState } from "react";; import { Button, Logo } from "@/components/ui";` |
| `/finanzen` | `import { FinancePage } from "@/components/app-pages";` |
| `/impressum` | `import type {Metadata} from "next";; import {LegalPage} from "@/components/legal-page";; import {legalConfig} from "@/config/legal";` |
| `/kunden/[id]` | `import { CustomerDetail } from "@/components/app-pages";` |
| `/kunden/neu` | `import { CustomerForm } from "@/components/app-pages";` |
| `/kunden` | `import { CustomersPage } from "@/components/app-pages";` |
| `/login` | `import Link from "next/link";; import {FormEvent,useState} from "react";; import {Button,Icon,Logo} from "@/components/ui";; import {clearDemoClientSession} from "@/lib/client/backend";` |
| `/mitarbeiter/[id]` | `import { EmployeeForm } from "@/components/app-pages";` |
| `/mitarbeiter/neu` | `import { EmployeeForm } from "@/components/app-pages";` |
| `/mitarbeiter` | `import { SimpleModule } from "@/components/app-pages";` |
| `/offline` | `import Link from "next/link";; import { Logo } from "@/components/ui";` |
| `/operator/[...section]` | `import { OperatorPage } from "@/components/operator";; import { requireOperator } from "@/lib/server/operator";` |
| `/operator/login` | `import Link from "next/link";; import {useSearchParams} from "next/navigation";; import {useState} from "react";; import {Button,Logo} from "@/components/ui";` |
| `/operator` | `import { OperatorPage } from "@/components/operator";; import { requireOperator } from "@/lib/server/operator";` |
| `/` | `import Link from "next/link";; import { MarketingFooter, MarketingHeader, MarketingFaq, ProductPreview, ProductScreen } from "@/components/marketing";; import { Button, Icon } from "@/components/ui";; import { domainConfig } from "@/config/domain";; import { plans as subscriptionPlans } from "@/lib/plans";` |
| `/passwort-vergessen` | `import Link from "next/link";; import { FormEvent, useState } from "react";; import { Button, Logo } from "@/components/ui";` |
| `/passwort-zuruecksetzen` | `import { FormEvent, useEffect, useState } from "react";; import { Button, Logo } from "@/components/ui";` |
| `/portal/login` | `import {redirect} from "next/navigation";` |
| `/portal` | `import {redirect} from "next/navigation";` |
| `/portal/registrieren` | `import {redirect} from "next/navigation";` |
| `/preise` | `import type { Metadata } from "next";; import Link from "next/link";; import { MarketingFooter, MarketingHeader } from "@/components/marketing";; import { Button, Icon } from "@/components/ui";; import { domainConfig } from "@/config/domain";; import { plans } from "@/lib/plans";` |
| `/preview/dashboard` | `import type { Metadata } from "next";; import { DashboardPage } from "@/components/app-pages";` |
| `/preview/rechnungen` | `import type { Metadata } from "next";; import { InvoicesPage } from "@/components/app-pages";` |
| `/preview/zeit` | `import type { Metadata } from "next";; import { TimePage } from "@/components/app-pages";` |
| `/produkt` | `import type { Metadata } from "next";; import { MarketingFooter, MarketingHeader, ProductPreview } from "@/components/marketing";; import { Button, Icon } from "@/components/ui";; import {domainConfig} from "@/config/domain";` |
| `/produkte/[id]` | `import { ProductForm } from "@/components/app-pages";` |
| `/produkte/neu` | `import { ProductForm } from "@/components/app-pages";` |
| `/produkte` | `import { SimpleModule } from "@/components/app-pages";` |
| `/rechnungen/[id]` | `import { InvoiceEditor } from "@/components/app-pages";` |
| `/rechnungen/neu` | `import { InvoiceEditor } from "@/components/app-pages";` |
| `/rechnungen` | `import { InvoicesPage } from "@/components/app-pages";` |
| `/registrieren` | `import Link from "next/link";; import {useRouter,useSearchParams} from "next/navigation";; import {FormEvent,useMemo,useState} from "react";; import {Eye,EyeOff} from "lucide-react";; import ConfirmDialog from "@/components/confirm-dialog";; import {Button,Logo} from "@/components/ui";; import {clearDemoClientSession} from "@/lib/client/backend";; import {billingCycles,domainConfig,planIds,type BillingCycle,type PlanId} from "@/config/domain";; import {plans} from "@/lib/plans";; import {legalConfig} from "@/config/legal";` |
| `/spesen/[id]` | `import { ExpenseForm } from "@/components/app-pages";` |
| `/spesen/neu` | `import { ExpenseForm } from "@/components/app-pages";` |
| `/spesen` | `import { SimpleModule } from "@/components/app-pages";` |
| `/support/[id]` | `import { SupportChat } from "@/components/app-pages";` |
| `/support/neu` | `import { SupportTicketForm } from "@/components/app-pages";` |
| `/support` | `import { SimpleModule } from "@/components/app-pages";` |
| `/unterauftragsbearbeiter` | `import type {Metadata} from "next";; import {LegalPage} from "@/components/legal-page";; import {legalConfig} from "@/config/legal";` |
| `/willkommen` | `import {redirect} from "next/navigation";` |
| `/zahlungen/[id]` | `import { PaymentDetail } from "@/components/app-pages";` |
| `/zahlungen/neu` | `import { PaymentForm } from "@/components/app-pages";` |
| `/zahlungen` | `import { SimpleModule } from "@/components/app-pages";` |
| `/zeit` | `import { TimePage } from "@/components/app-pages";` |
