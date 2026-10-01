# Binso One v1.6.9 — Final Mobile/PWA Master Cleanup

## Zentral umgesetzt
- Kanonische Mobile/PWA-Designschicht `styles/mobile-pwa.css`, geladen nach den generischen Desktop-/Primitive-Styles.
- Mobile/PWA Light exakt weiss/schwarz; Dark exakt schwarz/weiss. Graue Surface-Abstufungen werden im Mobile-Vertrag nicht als dekorative Flächen verwendet.
- Floating Pill Bottom Navigation mit Safe Areas; Desktop-Navigation bleibt unverändert.
- `Mehr` ist ein vollhohes Navigationspanel; Quick Create bleibt ein content-adaptives Bottom Sheet; Account öffnet als Top Panel aus dem Header.
- Mobile Header enthält Logo + Avatar, keine globale Suche und keine Blur-/Gradient-/Glow-Effekte.
- Zentrale Mobile Record-Komponente mit normalisiertem Duplicate-Subtitle-Guard.
- Listen-/Filter-/Sort-/View-State wird pro Modul in Session Storage erhalten.
- Detailseiten werden mobil flach dargestellt; seltene/destruktive Aktionen liegen im Overflow.
- Generische Create-Formulare verwenden Pflichtfelder zuerst und progressive Zusatzangaben.
- Offerten/Rechnungen verwenden mobil einen geführten 4-Schritt-Flow: Empfänger, Positionen, weitere Angaben, Prüfen.
- Zentrale Form-Primitives für Datum, Zeit, Zahl, Währung, FormSection und FormActions ergänzt.
- Record-Edit wird mobil als eigener Full-Viewport-Form-Kontext statt als riesiges Bottom Sheet dargestellt.
- Running Timer bleibt serverbasiert und erscheint nur bei aktivem Timer kompakt headernah.
- Mobile Toasts erscheinen oben; Fehler/Warnungen bleiben länger sichtbar; Timer/Toast-Kollision ist zentral berücksichtigt.
- Technische `lokal/yerel`-Labels aus Record-Details entfernt; leerer Kontakt-Demo-Fallback entfernt.
- Textuelle Back-Navigation in den betroffenen App-/Auth-/Onboarding-Flows entfernt bzw. durch fachliche/ikonische Navigation ersetzt.
- i18n für neue sichtbare Texte in DE/EN/FR/IT/TR ergänzt.

## Architektur
Keine neue Datenbankmigration. Die bereits enthaltene Forward-Migration `0019_v163_productivity_ux.sql` bleibt Bestandteil des vollständigen Release-Stands.

## R2 QA correction

- Replaced effect-driven list-state hydration with a central `useSyncExternalStore` session-storage hook. This keeps persisted list/search/filter/sort/view state without synchronous `setState` calls in an effect and remains hydration-safe.
- Renamed the route-matrix loop identifier from the reserved Next.js `module` name to `moduleKey`.
- Removed the unused responsive CSS binding from the UI interaction self-check.
- Added release guards for the persisted-list-state hook so the lint regression cannot silently return.
## R3 lint correction

- Removed the remaining unused `ChevronDown` import from the business document editor.
- Removed the unused document-detail module configuration lookup/import.
- Reworked the session JSON state hook so its render path no longer reads `ref.current`; the fallback is handled as a normal hook input and the setter declares it as a dependency.
- Extended the Mobile/PWA final contract to reject the render-time ref regression.
- R3 remains version `1.6.9` because no previous v1.6.9 candidate was deployed.

