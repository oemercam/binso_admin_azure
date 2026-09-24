import type { CompanyProfile, DocumentTemplates } from '@/types/domain'

export const defaultCompanyProfile: CompanyProfile = {
  name: '',
  address: '',
  zip: '',
  city: '',
  country: 'Schweiz',
  uid: '',
  email: '',
  phone: '',
  website: '',
  iban: '',
  bankName: '',
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
  invoiceEmailSubject: 'Rechnung {{number}}',
  invoiceEmailBody:
    'Guten Tag\n\nIm Anhang erhalten Sie unsere Rechnung {{number}} über {{amount}}.\n\nFreundliche Grüsse',
  quoteEmailSubject: 'Angebot {{number}}',
  quoteEmailBody:
    'Guten Tag\n\nIm Anhang erhalten Sie unser Angebot {{number}}.\n\nFreundliche Grüsse',
  reminderEmailSubject: 'Zahlungserinnerung zu Rechnung {{number}}',
  reminderEmailBody:
    'Guten Tag\n\nGerne erinnern wir Sie an die noch offene Rechnung {{number}} über {{amount}}.\n\nFreundliche Grüsse',
}
