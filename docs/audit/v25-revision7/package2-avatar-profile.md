# Paket 2 — Avatar und Profilbild

Basis: `de6d805f88e0890f3999fec2af0eda7032ecd24a`, vorhandener AvatarUpload,
FileUpload, FormSheet, Avatar und zentrale Upload-/Scan-/Dateiverarbeitung.
Keine neue Upload-Foundation, Migration, Navigation oder FAB-Änderung.

Die bestehende lokale Vorschau erhält zugängliche Regler für Vergrösserung und
horizontalen/vertikalen Ausschnitt. Vorschau und Server verwenden dieselben
normalisierten Koordinaten und ganzzahligen Quellpixelgrenzen. Zuschnitt erfolgt
nach EXIF-Ausrichtung, serverseitige Ausgabe bleibt quadratisch512×512 ohne
EXIF/GPS/ICC. Profil104px, Header34px und Listen36px bleiben unverändert rund.
Kameraauswahl ist eine optionale zweite Picker-Aktion des bestehenden FileUpload;
Galerieauswahl bleibt erhalten. Kein Upload bei Auswahl, Regleränderung oder Abbruch.

Bestätigung übergibt Originalbytes und begrenzte Ausschnittparameter an denselben
Decoder/Scanner. Wiederholung desselben File-/Crop-Paars behält ihren Schlüssel;
ein geänderter Ausschnitt bekommt eine eigene Identität. Quarantäne, Ablehnung,
Eigentümer-/Mandantengrenzen, bedingte Aktivierung und kontrolliertes Entfernen
bleiben bestehen. Archivierte Dateien werden nicht als aktive Profilreferenz behalten.

JPEG/PNG/WebP sind durch echte Dekodierung qualifiziert. HEIC/HEIF sind ausdrücklich
nicht freigegeben; Auswahlhinweis nennt JPEG-Export. Keine neue unsichere Format-
oder Providerfreigabe. Die Smartphone-Kamera muss ein unterstütztes Format liefern.

Lokal tatsächlich bestanden: Bildnormalisierung mit exakt gewählten Farbbereichen,
Zuschnitt nach EXIF-Drehung,512px, Metadatenentfernung, ungültige Parameter,
MIME-/Decoderabweichung, kaputte/zu grosse Bilder und HEIC/HEIF-Ablehnung.
Bestehende Auth-/Upload-/Quarantäne-/Datenverträge, betroffener Lint, Typecheck,
Sprachabdeckung und CSS-Owner-Prüfung bestanden. Keine Sicherheitsassertion entfernt.

Der gezielte Avatar-Browserfall verwendet echte Profilkomponenten mit synthetischen
API-/Scannerantworten, drei Breiten390/820/1440 und einen kurzen400px-Viewport.
Er prüft Auswahl/Kamera-Picker, Regler, Abbruch, explizite/doppelte Bestätigung,
Fehler/Retry, Quarantäne/Aktivierung, Ersetzen/Entfernen, Reload und Header-Konsistenz.
Die bestehende native HTTP-Prüfung ergänzt alle acht Rollen, fremden Mandanten,
neue echte serverseitige Session, gespeicherte Referenz und archivierten Download.
Die Pflicht-CI und der gezielte Chromium-/WebKit-Job sind beim Erstellen dieser
Notiz noch ausstehend; alte Ergebnisse qualifizieren den neuen Code nicht.

Offen separat: tatsächliche iPhone-/Android-Kamera samt OS-Formatwahl, installierte
PWA, reale Safe-Area/OS-Tastatur und physische Retina-Geräte. Browseremulation ist
keine physische Geräteabnahme. Kein Merge, produktive Migration oder Deployment;
Paket3 wird nicht begonnen.
