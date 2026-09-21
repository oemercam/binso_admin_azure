import type { CompanyProfile, DocumentTemplates } from '@/types/domain'

export const defaultCompanyProfile: CompanyProfile = {
  name: 'Binso GmbH',
  address: 'Weissbadstrasse 8b',
  zip: '9050',
  city: 'Appenzell',
  country: 'Schweiz',
  uid: 'CHE-000.000.000 MWST',
  email: 'info@binso.ch',
  phone: '+41 58 510 77 58',
  website: 'www.binso.ch',
  iban: 'CH00 0000 0000 0000 0000 0',
  bankName: 'Schweizer Bank',
  defaultPaymentDays: 30,
}

export const defaultDocumentTemplates: DocumentTemplates = {
  invoiceIntro:
    'Besten Dank für Ihren Auftrag. Für die im aufgeführten Zeitraum erbrachten Leistungen stellen wir Ihnen folgende Positionen in Rechnung.',
  invoiceOutro:
    'Wir danken Ihnen für die angenehme Zusammenarbeit. Bitte überweisen Sie den Rechnungsbetrag innerhalb der angegebenen Zahlungsfrist unter Angabe der Rechnungsnummer.',
  quoteIntro:
    'Besten Dank für Ihr Interesse. Gerne unterbreiten wir Ihnen für die beschriebenen Leistungen folgendes Angebot.',
  quoteOutro:
    'Dieses Angebot ist bis zum angegebenen Datum gültig. Wir freuen uns auf Ihre Rückmeldung und stehen bei Fragen gerne zur Verfügung.',
  reminderIntro:
    'Bei unserer Kontrolle haben wir festgestellt, dass die unten aufgeführte Rechnung noch offen ist.',
  reminderOutro:
    'Falls sich Ihre Zahlung mit diesem Schreiben gekreuzt hat, betrachten Sie diese Erinnerung bitte als gegenstandslos. Besten Dank für die zeitnahe Erledigung.',
  invoiceEmailSubject: 'Rechnung {{number}} – Binso GmbH',
  invoiceEmailBody:
    'Guten Tag\n\nIm Anhang erhalten Sie unsere Rechnung {{number}} über {{amount}}.\n\nFreundliche Grüsse\nBinso GmbH',
  quoteEmailSubject: 'Angebot {{number}} – Binso GmbH',
  quoteEmailBody:
    'Guten Tag\n\nIm Anhang erhalten Sie unser Angebot {{number}}.\n\nFreundliche Grüsse\nBinso GmbH',
  reminderEmailSubject: 'Zahlungserinnerung zu Rechnung {{number}} – Binso GmbH',
  reminderEmailBody:
    'Guten Tag\n\nGerne erinnern wir Sie an die noch offene Rechnung {{number}} über {{amount}}.\n\nFreundliche Grüsse\nBinso GmbH',
}
