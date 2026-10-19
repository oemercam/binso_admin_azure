/** Examples are presentation only. Never use these values to initialize form data. */
const examples:Readonly<Record<string,string>>={
 "firmenname":"Muster AG","kundenname":"Muster AG",
 "vorname":"Max","nachname":"Muster","kontaktperson · vorname":"Max","kontaktperson · nachname":"Muster",
 "e-mail":"max.muster@beispiel.ch","telefon":"+41 31 555 12 34",
 "strasse":"Bahnhofstrasse","hausnummer":"12","plz":"3000","ort":"Bern",
 "iban":"CH93 0076 2011 6238 5295 7","stundensatz":"150.00",
 "beschreibung":"z. B. IT-Beratung und Support","bezeichnung":"z. B. IT-Beratung",
 "funktion":"z. B. Buchhaltung","einzelpreis":"150.00","menge":"1",
 "uid":"CHE-123.456.789","qr-iban":"CH…","zahlungsreferenz":"RF… oder QR-Referenz",
 "begründung":"Grund angeben","interne begründung":"Grund angeben",
 "empfänger":"max.muster@beispiel.ch",
};
export function fieldInputHint(label:unknown,type="text"):string|undefined{
 if(typeof label!=="string"||!["text","email","tel","number","search"].includes(type))return undefined;
 return examples[label.replace(/\s*\*\s*$/,"").trim().toLocaleLowerCase("de-CH")];
}
