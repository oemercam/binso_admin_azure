# Permission Test Plan v1.0.0

## Automatischer Matrix-Selbsttest

```powershell
pnpm permissions:test
```

Prüft u. a.:
- Admin darf kein Abo ändern.
- Finanzen darf Buchhaltung, aber keinen Lohn.
- Personal darf Lohn, aber keine Bankbuchungen.
- Mitarbeiter darf keine Rechnungen bearbeiten.
- Mitarbeiter erhält Own-Record-Scope für Zeit.
- Support darf Mandantenmetadaten lesen, aber keine Operatoren verwalten.
- Security Auditor darf Audit lesen, aber keine Operatorrollen verwalten.

## Lokaler UI-Test

Unter Einstellungen → Benutzer und Rollen nacheinander Testbenutzer aktivieren:
- Inhaber
- Admin
- Finanzen
- Personal
- Projektleitung
- Mitarbeiter
- Lesen

Prüfen, dass Navigation und Schreibaktionen der Matrix entsprechen. Direkter Aufruf eines nicht erlaubten Bereichs muss nach `/forbidden` führen bzw. eine schreibende Aktion darf nicht angeboten werden.

## Produktiver API-Test

Nach DB-Migration und Production Mode:
1. Zwei Organisationen A/B registrieren.
2. Benutzerrollen pro Organisation anlegen.
3. IDs von Organisation B mit Session von Organisation A aufrufen.
4. Erwartung: keine Daten von B; 404/403.
5. `reader`: POST/PATCH/DELETE auf `/api/records` muss 403 ergeben.
6. `member`: fremden eigenen Record eines anderen Users ändern muss scheitern.
7. `finance`: Payroll-Modul muss 403 ergeben.
8. `hr`: Bank/Buchhaltung schreiben muss 403 ergeben.
9. Admin versucht letzten Owner zu deaktivieren: 403/409.

## Betreiber-Test

1. `pnpm operator:bootstrap`
2. `/operator/login`
3. Support, Billing und Security Auditor anlegen.
4. Support: `/operator/kunden` erlaubt, `/operator/benutzer` nicht sichtbar/API 403.
5. Billing: Abo-Metadaten lesbar, Audit/Operatoren nicht.
6. Security Auditor: Audit und Operatorliste lesbar, Änderungen API 403.
7. Prüfen, dass es **keinen** `/api/operator/records` Endpunkt gibt.
