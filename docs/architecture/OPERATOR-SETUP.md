# Betreiberzugang initialisieren

Nach `pnpm db:migrate` werden der erste Plattform-Inhaber und danach weitere Operatoren eingerichtet.

Environment:

```env
OPERATOR_BOOTSTRAP_EMAIL=operator@binso.ch
OPERATOR_BOOTSTRAP_PASSWORD=<mindestens 12 Zeichen>
```

Dann:

```bash
pnpm operator:bootstrap
```

Login:

`/operator/login`

Der Bootstrap legt ausschliesslich einen `platform_owner` in `platform_users` an. Das Passwort wird mit Scrypt gehasht. Danach können weitere Betreiberrollen über `/operator/benutzer` angelegt werden.

Wichtig: Betreiberkonten sind nicht mit Kundenkonten identisch und erhalten über die Betreiber-APIs keinen Zugriff auf Kundengeschäftsdaten.
