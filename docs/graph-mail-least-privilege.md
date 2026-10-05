# Binso One – Microsoft Graph Mail Least Privilege

Stand: 5. Oktober 2026

## Ziel
Die App **Binso One Mail Service** soll produktiv ausschliesslich als `one@binso.ch` senden können.

Der aktuelle Entra-Grant `Mail.Send` als Application Permission ist organisationsweit. Für den finalen Go-live soll der Zugriff mit **Exchange Online Role Based Access Control for Applications (Application RBAC)** auf die erforderliche Mailbox eingeschränkt werden.

Microsoft-Dokumentation:
- https://learn.microsoft.com/exchange/permissions-exo/application-rbac
- https://learn.microsoft.com/powershell/exchange/recipientfilter-properties

## Voraussetzungen
- Exchange Online PowerShell
- Exchange Administrator bzw. die erforderlichen Exchange-RBAC-Rechte
- Client/Application ID der App **Binso One Mail Service**
- **Object ID des Enterprise Application / Service Principal** in Microsoft Entra ID
- freigegebenes Postfach `one@binso.ch`

Wichtig: Für `New-ServicePrincipal` wird die Object ID des **Service Principals / Enterprise Application** benötigt, nicht die Object ID der App-Registrierung.

## Vorgehen

### 1. Exchange Online verbinden

```powershell
Connect-ExchangeOnline
```

### 2. Mailbox prüfen

```powershell
Get-Recipient -Identity "one@binso.ch" |
  Format-List DisplayName,PrimarySmtpAddress,RecipientTypeDetails
```

### 3. Service Principal in Exchange registrieren

Platzhalter durch die Werte der App **Binso One Mail Service** ersetzen:

```powershell
New-ServicePrincipal `
  -AppId "<CLIENT-APPLICATION-ID>" `
  -ObjectId "<ENTERPRISE-APPLICATION-SERVICE-PRINCIPAL-OBJECT-ID>" `
  -DisplayName "Binso One Mail Service"
```

Falls der Exchange-Service-Principal bereits besteht, nicht doppelt anlegen. Mit `Get-ServicePrincipal` prüfen.

### 4. Resource Scope nur für die Binso-One-Mailbox erstellen

```powershell
New-ManagementScope `
  -Name "Binso One Mailbox Scope" `
  -RecipientRestrictionFilter "EmailAddresses -eq 'SMTP:one@binso.ch'"
```

Danach kontrollieren:

```powershell
Get-ManagementScope -Identity "Binso One Mailbox Scope" |
  Format-List Name,RecipientFilter
```

### 5. Application Mail.Send im Scope zuweisen

```powershell
New-ManagementRoleAssignment `
  -Name "Binso One Mail Send" `
  -App "<ENTERPRISE-APPLICATION-SERVICE-PRINCIPAL-OBJECT-ID>" `
  -Role "Application Mail.Send" `
  -CustomResourceScope "Binso One Mailbox Scope"
```

### 6. Scope testen

Erlaubter Absender:

```powershell
Test-ServicePrincipalAuthorization `
  -Identity "<ENTERPRISE-APPLICATION-SERVICE-PRINCIPAL-OBJECT-ID>" `
  -Resource "one@binso.ch" |
  Format-Table
```

Für `one@binso.ch` muss die Rolle `Application Mail.Send` im Scope liegen.

Zusätzlich mit mindestens einer anderen Binso-Mailbox testen. Diese darf für `Application Mail.Send` **nicht** im Scope liegen.

### 7. Unbeschränkte Entra-Berechtigung entfernen

Erst wenn der scoped RBAC-Test und ein echter Graph-Mailversand erfolgreich sind:

**Microsoft Entra ID → App-Registrierungen → Binso One Mail Service → API-Berechtigungen**

Die organisationsweite Microsoft-Graph-Anwendungsberechtigung `Mail.Send` entfernen.

Dieser Schritt ist zwingend für echte Einschränkung: Entra Application Permissions und Exchange Application RBAC wirken additiv. Bleibt der unbeschränkte Entra-Grant bestehen, kann der scoped RBAC-Grant die organisationsweite Berechtigung nicht einschränken.

### 8. Produktion erneut prüfen

- Microsoft Graph Mail Readiness Workflow ausführen.
- E-Mail von `one@binso.ch` an ein kontrolliertes externes Testpostfach senden.
- Negativtest: Die Anwendung darf nicht als andere Binso-Mailbox senden können.
- Ergebnis dokumentieren.

## Rückfall
Wenn der Graph-Versand nach der Umstellung fehlschlägt, nicht auf einen zweiten Mailprovider ausweichen. RBAC-Konfiguration prüfen und korrigieren. Binso One bleibt Microsoft-Graph-only.
