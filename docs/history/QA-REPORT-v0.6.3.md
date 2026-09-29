# QA v0.6.3

Behoben:
- React/Next.js Hydration-Mismatch durch DOM-Mutationen der i18n-Schicht.

Ursache:
- Die bisherige Locale-Schicht speicherte Originalwerte als `data-i18n...` Attribute direkt im DOM.
- Durch frühe bzw. während nachlaufender Hydration auftretende DOM-Mutationen konnten Server-HTML und Client-Tree voneinander abweichen.

Änderungen:
- keine `data-i18n...` Attribute mehr.
- Originaltexte/-attribute werden ausschliesslich in `WeakMap`s gehalten.
- erste Übersetzung erst nach abgeschlossener Initial-Hydration mit kurzer Verzögerung.
- `MutationObserver` wird erst danach aktiviert.
- bei Client-Navigation wird die aktuelle Sprache erneut angewendet.
- bei Sprachwechsel wird die UI ohne zusätzliche DOM-Metadaten aktualisiert.
