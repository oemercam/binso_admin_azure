"use client";

export type Locale = "de" | "en" | "fr" | "it";
export const localeLabels:Record<Locale,string>={de:"DE",en:"EN",fr:"FR",it:"IT"};
export const localeNames:Record<Locale,string>={de:"Deutsch",en:"English",fr:"Français",it:"Italiano"};
const KEY="binso-one-locale-v1";

const en:Record<string,string>={
"Übersicht":"Overview","Verkauf":"Sales","Projekte":"Projects","Einkauf":"Purchasing","Finanzen":"Finance","Personal":"HR","Stammdaten":"Master data","System":"System",
"Dashboard":"Dashboard","Aufgaben":"Tasks","Kunden":"Customers","Offerten":"Quotes","Aufträge":"Orders","Rechnungen":"Invoices","Zahlungen":"Payments","Zeiterfassung":"Time tracking","Spesen":"Expenses","Lieferanten":"Suppliers","Eingangsrechnungen":"Supplier invoices","Buchhaltung":"Accounting","Bank":"Bank","MWST":"VAT","Berichte":"Reports","Mitarbeitende":"Employees","Abwesenheiten":"Absences","Lohn":"Payroll","Produkte und Leistungen":"Products & services","Dokumente":"Documents","Verträge":"Contracts","Einstellungen":"Settings",
"Anmelden":"Sign in","Registrieren":"Register","Abmelden":"Sign out","Kostenlos starten":"Start free","14 Tage kostenlos testen":"Try free for 14 days","Demo öffnen":"Open demo","Demo ansehen":"View demo",
"Willkommen zurück":"Welcome back","Konto erstellen":"Create account","Kostenlos testen":"Try for free","Weiter zur Zahlung":"Continue to payment","Testorganisation erstellen":"Create trial organisation","Weiter":"Continue","Zum Dashboard":"Go to dashboard",
"Speichern":"Save","Abbrechen":"Cancel","Löschen":"Delete","Bearbeiten":"Edit","Zurück":"Back","Schliessen":"Close","Bestätigen":"Confirm","Fortfahren":"Continue","Erstellen":"Create","Hinzufügen":"Add","Versenden":"Send","Vorschau":"Preview","Drucken / PDF":"Print / PDF","Entwurf speichern":"Save draft","Entwurf":"Draft",
"Suche":"Search","Keine Treffer":"No results","Mehr":"More","Firma":"Company","Benutzer und Firmen verwalten":"Manage users and companies","Lokale Entwicklungsumgebung":"Local development environment",
"Firmenname":"Company name","Kontaktperson":"Contact person","E-Mail":"Email","Telefon":"Phone","Adresse":"Address","Strasse und Nr.":"Street and no.","PLZ / Ort":"ZIP / City","Notiz":"Note","Status":"Status","Datum":"Date","Betrag":"Amount","Betrag CHF":"Amount CHF","Kunde":"Customer","Projekt":"Project","Beschreibung":"Description","Mitarbeiter":"Employee","Name":"Name","Funktion":"Role","IBAN":"IBAN","UID":"UID","UID / MWST":"UID / VAT",
"Pflichtfeld":"Required field","Dieses Feld ist erforderlich.":"This field is required.","Bitte prüfen Sie die markierten Pflichtfelder.":"Please check the highlighted required fields.","Ungültige E-Mail-Adresse.":"Invalid email address.",
"Erfolg":"Success","Fehler":"Error","Hinweis":"Notice","Warnung":"Warning","Erfolgreich gespeichert.":"Saved successfully.","Änderungen gespeichert.":"Changes saved.","Ein Fehler ist aufgetreten.":"An error occurred.","Bitte versuchen Sie es erneut.":"Please try again.",
"Möchten Sie wirklich abbrechen?":"Do you really want to cancel?","Nicht gespeicherte Änderungen gehen verloren.":"Unsaved changes will be lost.","Einrichtung abbrechen":"Cancel setup","Onboarding abbrechen":"Cancel onboarding","Onboarding wirklich abbrechen?":"Really cancel onboarding?","Du kannst die Einrichtung später fortsetzen.":"You can continue setup later.",
"Seite nicht gefunden":"Page not found","Die angeforderte Seite konnte nicht gefunden werden.":"The requested page could not be found.","Zur Startseite":"Go to home","Zurück zum Dashboard":"Back to dashboard","Etwas ist schiefgelaufen":"Something went wrong","Die Anwendung konnte diese Ansicht nicht laden.":"The application could not load this view.","Erneut versuchen":"Try again","Zugriff verweigert":"Access denied","Du hast keine Berechtigung für diese Seite.":"You do not have permission to view this page.","Wartung":"Maintenance","Binso One wird gerade gewartet.":"Binso One is currently under maintenance.","Offline":"Offline","Keine Internetverbindung.":"No internet connection.",
"Unternehmensübersicht":"Company overview","Die wichtigsten Kennzahlen, Aufgaben und offenen Prozesse auf einen Blick.":"Key metrics, tasks and open processes at a glance.",
"Rechnung erstellen":"Create invoice","Offerte erstellen":"Create quote","Live-Vorschau":"Live preview","Empfänger und Angaben":"Recipient & details","Positionen":"Items","Einzelpreis":"Unit price","Menge":"Quantity","Preis":"Price","Total":"Total","Netto":"Net","Rabatt":"Discount","Brutto Positionen":"Gross items","Zwischentotal":"Subtotal","Einleitung":"Introduction","Fällig":"Due","Aktionen":"Actions","Versand":"Delivery","Empfänger":"Recipient","Betreff":"Subject","Nachricht":"Message","Demo-Versand ausführen":"Run demo delivery",
"Die Eingaben werden für lokale Tests im Browser gespeichert.":"Entries are stored in the browser for local testing.","Für diesen Datentyp ist kein lokales Formular konfiguriert.":"No local form is configured for this data type.",
"Alle lokal erfassten Demo-Daten löschen?":"Delete all locally stored demo data?","Demo-Daten zurücksetzen":"Reset demo data","Datensatz gelöscht.":"Record deleted.","wurde lokal gespeichert.":"was saved locally.",
"Monatlich":"Monthly","Jährlich · 2 Monate gratis":"Yearly · 2 months free","Monat":"Month","Jahr":"Year","Preise":"Pricing","Sicherheit":"Security","Funktionen":"Features",
"Deine Firma":"Your company","Unternehmen einordnen":"Company profile","Bereit zum Start":"Ready to start","Einrichtung":"Setup","Branche":"Industry","Geschäftliche E-Mail":"Business email","Passwort":"Password",
"Abo abschliessen":"Complete subscription","Zahlungsdaten":"Payment details","Karteninhaber":"Cardholder","Kartennummer":"Card number","Gültig bis":"Expiry","Zahlung simulieren und fortfahren":"Simulate payment and continue","Es wird keine echte Zahlung verarbeitet.":"No real payment is processed."
};

const fr:Record<string,string>={
"Übersicht":"Vue d’ensemble","Verkauf":"Ventes","Projekte":"Projets","Einkauf":"Achats","Finanzen":"Finances","Personal":"Personnel","Stammdaten":"Données de base","System":"Système",
"Dashboard":"Tableau de bord","Aufgaben":"Tâches","Kunden":"Clients","Offerten":"Offres","Aufträge":"Commandes","Rechnungen":"Factures","Zahlungen":"Paiements","Zeiterfassung":"Saisie du temps","Spesen":"Frais","Lieferanten":"Fournisseurs","Eingangsrechnungen":"Factures fournisseurs","Buchhaltung":"Comptabilité","Bank":"Banque","MWST":"TVA","Berichte":"Rapports","Mitarbeitende":"Collaborateurs","Abwesenheiten":"Absences","Lohn":"Salaires","Produkte und Leistungen":"Produits et prestations","Dokumente":"Documents","Verträge":"Contrats","Einstellungen":"Paramètres",
"Anmelden":"Se connecter","Registrieren":"S’inscrire","Abmelden":"Se déconnecter","Kostenlos starten":"Commencer gratuitement","14 Tage kostenlos testen":"Essayer gratuitement 14 jours","Demo öffnen":"Ouvrir la démo","Demo ansehen":"Voir la démo",
"Willkommen zurück":"Bon retour","Konto erstellen":"Créer un compte","Kostenlos testen":"Essayer gratuitement","Weiter zur Zahlung":"Continuer vers le paiement","Testorganisation erstellen":"Créer l’organisation d’essai","Weiter":"Continuer","Zum Dashboard":"Aller au tableau de bord",
"Speichern":"Enregistrer","Abbrechen":"Annuler","Löschen":"Supprimer","Bearbeiten":"Modifier","Zurück":"Retour","Schliessen":"Fermer","Bestätigen":"Confirmer","Fortfahren":"Continuer","Erstellen":"Créer","Hinzufügen":"Ajouter","Versenden":"Envoyer","Vorschau":"Aperçu","Drucken / PDF":"Imprimer / PDF","Entwurf speichern":"Enregistrer le brouillon","Entwurf":"Brouillon",
"Suche":"Recherche","Keine Treffer":"Aucun résultat","Mehr":"Plus","Firma":"Entreprise","Benutzer und Firmen verwalten":"Gérer les utilisateurs et entreprises","Lokale Entwicklungsumgebung":"Environnement de développement local",
"Firmenname":"Nom de l’entreprise","Kontaktperson":"Personne de contact","E-Mail":"E-mail","Telefon":"Téléphone","Adresse":"Adresse","Strasse und Nr.":"Rue et n°","PLZ / Ort":"NPA / Localité","Notiz":"Note","Status":"Statut","Datum":"Date","Betrag":"Montant","Betrag CHF":"Montant CHF","Kunde":"Client","Projekt":"Projet","Beschreibung":"Description","Mitarbeiter":"Collaborateur","Name":"Nom","Funktion":"Fonction","IBAN":"IBAN","UID":"IDE","UID / MWST":"IDE / TVA",
"Pflichtfeld":"Champ obligatoire","Dieses Feld ist erforderlich.":"Ce champ est obligatoire.","Bitte prüfen Sie die markierten Pflichtfelder.":"Veuillez vérifier les champs obligatoires signalés.","Ungültige E-Mail-Adresse.":"Adresse e-mail invalide.",
"Erfolg":"Succès","Fehler":"Erreur","Hinweis":"Information","Warnung":"Avertissement","Erfolgreich gespeichert.":"Enregistré avec succès.","Änderungen gespeichert.":"Modifications enregistrées.","Ein Fehler ist aufgetreten.":"Une erreur est survenue.","Bitte versuchen Sie es erneut.":"Veuillez réessayer.",
"Möchten Sie wirklich abbrechen?":"Voulez-vous vraiment annuler ?","Nicht gespeicherte Änderungen gehen verloren.":"Les modifications non enregistrées seront perdues.","Einrichtung abbrechen":"Annuler la configuration","Onboarding abbrechen":"Annuler l’intégration","Onboarding wirklich abbrechen?":"Voulez-vous vraiment annuler l’intégration ?","Du kannst die Einrichtung später fortsetzen.":"Vous pourrez reprendre la configuration plus tard.",
"Seite nicht gefunden":"Page introuvable","Die angeforderte Seite konnte nicht gefunden werden.":"La page demandée est introuvable.","Zur Startseite":"Retour à l’accueil","Zurück zum Dashboard":"Retour au tableau de bord","Etwas ist schiefgelaufen":"Une erreur s’est produite","Die Anwendung konnte diese Ansicht nicht laden.":"L’application n’a pas pu charger cette vue.","Erneut versuchen":"Réessayer","Zugriff verweigert":"Accès refusé","Du hast keine Berechtigung für diese Seite.":"Vous n’avez pas l’autorisation d’accéder à cette page.","Wartung":"Maintenance","Binso One wird gerade gewartet.":"Binso One est actuellement en maintenance.","Offline":"Hors ligne","Keine Internetverbindung.":"Aucune connexion Internet.",
"Unternehmensübersicht":"Vue d’ensemble de l’entreprise","Die wichtigsten Kennzahlen, Aufgaben und offenen Prozesse auf einen Blick.":"Les principaux indicateurs, tâches et processus ouverts en un coup d’œil.",
"Rechnung erstellen":"Créer une facture","Offerte erstellen":"Créer une offre","Live-Vorschau":"Aperçu en direct","Empfänger und Angaben":"Destinataire et informations","Positionen":"Positions","Einzelpreis":"Prix unitaire","Menge":"Quantité","Preis":"Prix","Total":"Total","Netto":"Net","Rabatt":"Remise","Brutto Positionen":"Brut des positions","Zwischentotal":"Sous-total","Einleitung":"Introduction","Fällig":"Échéance","Aktionen":"Actions","Versand":"Envoi","Empfänger":"Destinataire","Betreff":"Objet","Nachricht":"Message","Demo-Versand ausführen":"Exécuter l’envoi de démonstration",
"Die Eingaben werden für lokale Tests im Browser gespeichert.":"Les données sont enregistrées dans le navigateur pour les tests locaux.","Für diesen Datentyp ist kein lokales Formular konfiguriert.":"Aucun formulaire local n’est configuré pour ce type de données.",
"Alle lokal erfassten Demo-Daten löschen?":"Supprimer toutes les données de démonstration locales ?","Demo-Daten zurücksetzen":"Réinitialiser les données de démo","Datensatz gelöscht.":"Enregistrement supprimé.","wurde lokal gespeichert.":"a été enregistré localement.",
"Monatlich":"Mensuel","Jährlich · 2 Monate gratis":"Annuel · 2 mois offerts","Monat":"Mois","Jahr":"Année","Preise":"Tarifs","Sicherheit":"Sécurité","Funktionen":"Fonctionnalités",
"Deine Firma":"Votre entreprise","Unternehmen einordnen":"Profil de l’entreprise","Bereit zum Start":"Prêt à démarrer","Einrichtung":"Configuration","Branche":"Secteur","Geschäftliche E-Mail":"E-mail professionnel","Passwort":"Mot de passe",
"Abo abschliessen":"Finaliser l’abonnement","Zahlungsdaten":"Données de paiement","Karteninhaber":"Titulaire de la carte","Kartennummer":"Numéro de carte","Gültig bis":"Expiration","Zahlung simulieren und fortfahren":"Simuler le paiement et continuer","Es wird keine echte Zahlung verarbeitet.":"Aucun paiement réel n’est traité."
};

const it:Record<string,string>={
"Übersicht":"Panoramica","Verkauf":"Vendite","Projekte":"Progetti","Einkauf":"Acquisti","Finanzen":"Finanze","Personal":"Personale","Stammdaten":"Dati di base","System":"Sistema",
"Dashboard":"Dashboard","Aufgaben":"Attività","Kunden":"Clienti","Offerten":"Offerte","Aufträge":"Ordini","Rechnungen":"Fatture","Zahlungen":"Pagamenti","Zeiterfassung":"Registrazione ore","Spesen":"Spese","Lieferanten":"Fornitori","Eingangsrechnungen":"Fatture fornitori","Buchhaltung":"Contabilità","Bank":"Banca","MWST":"IVA","Berichte":"Rapporti","Mitarbeitende":"Collaboratori","Abwesenheiten":"Assenze","Lohn":"Salari","Produkte und Leistungen":"Prodotti e servizi","Dokumente":"Documenti","Verträge":"Contratti","Einstellungen":"Impostazioni",
"Anmelden":"Accedi","Registrieren":"Registrati","Abmelden":"Esci","Kostenlos starten":"Inizia gratis","14 Tage kostenlos testen":"Prova gratis per 14 giorni","Demo öffnen":"Apri demo","Demo ansehen":"Vedi demo",
"Willkommen zurück":"Bentornato","Konto erstellen":"Crea account","Kostenlos testen":"Prova gratuitamente","Weiter zur Zahlung":"Continua al pagamento","Testorganisation erstellen":"Crea organizzazione di prova","Weiter":"Continua","Zum Dashboard":"Vai alla dashboard",
"Speichern":"Salva","Abbrechen":"Annulla","Löschen":"Elimina","Bearbeiten":"Modifica","Zurück":"Indietro","Schliessen":"Chiudi","Bestätigen":"Conferma","Fortfahren":"Continua","Erstellen":"Crea","Hinzufügen":"Aggiungi","Versenden":"Invia","Vorschau":"Anteprima","Drucken / PDF":"Stampa / PDF","Entwurf speichern":"Salva bozza","Entwurf":"Bozza",
"Suche":"Cerca","Keine Treffer":"Nessun risultato","Mehr":"Altro","Firma":"Azienda","Benutzer und Firmen verwalten":"Gestisci utenti e aziende","Lokale Entwicklungsumgebung":"Ambiente di sviluppo locale",
"Firmenname":"Nome azienda","Kontaktperson":"Persona di contatto","E-Mail":"E-mail","Telefon":"Telefono","Adresse":"Indirizzo","Strasse und Nr.":"Via e n.","PLZ / Ort":"NPA / Località","Notiz":"Nota","Status":"Stato","Datum":"Data","Betrag":"Importo","Betrag CHF":"Importo CHF","Kunde":"Cliente","Projekt":"Progetto","Beschreibung":"Descrizione","Mitarbeiter":"Collaboratore","Name":"Nome","Funktion":"Ruolo","IBAN":"IBAN","UID":"IDI","UID / MWST":"IDI / IVA",
"Pflichtfeld":"Campo obbligatorio","Dieses Feld ist erforderlich.":"Questo campo è obbligatorio.","Bitte prüfen Sie die markierten Pflichtfelder.":"Controlla i campi obbligatori evidenziati.","Ungültige E-Mail-Adresse.":"Indirizzo e-mail non valido.",
"Erfolg":"Successo","Fehler":"Errore","Hinweis":"Informazione","Warnung":"Avviso","Erfolgreich gespeichert.":"Salvato con successo.","Änderungen gespeichert.":"Modifiche salvate.","Ein Fehler ist aufgetreten.":"Si è verificato un errore.","Bitte versuchen Sie es erneut.":"Riprova.",
"Möchten Sie wirklich abbrechen?":"Vuoi davvero annullare?","Nicht gespeicherte Änderungen gehen verloren.":"Le modifiche non salvate andranno perse.","Einrichtung abbrechen":"Annulla configurazione","Onboarding abbrechen":"Annulla onboarding","Onboarding wirklich abbrechen?":"Vuoi davvero annullare l’onboarding?","Du kannst die Einrichtung später fortsetzen.":"Potrai riprendere la configurazione più tardi.",
"Seite nicht gefunden":"Pagina non trovata","Die angeforderte Seite konnte nicht gefunden werden.":"La pagina richiesta non è stata trovata.","Zur Startseite":"Vai alla home","Zurück zum Dashboard":"Torna alla dashboard","Etwas ist schiefgelaufen":"Qualcosa è andato storto","Die Anwendung konnte diese Ansicht nicht laden.":"L’applicazione non ha potuto caricare questa vista.","Erneut versuchen":"Riprova","Zugriff verweigert":"Accesso negato","Du hast keine Berechtigung für diese Seite.":"Non hai i permessi per visualizzare questa pagina.","Wartung":"Manutenzione","Binso One wird gerade gewartet.":"Binso One è attualmente in manutenzione.","Offline":"Offline","Keine Internetverbindung.":"Nessuna connessione Internet.",
"Unternehmensübersicht":"Panoramica aziendale","Die wichtigsten Kennzahlen, Aufgaben und offenen Prozesse auf einen Blick.":"Indicatori, attività e processi aperti più importanti in un’unica vista.",
"Rechnung erstellen":"Crea fattura","Offerte erstellen":"Crea offerta","Live-Vorschau":"Anteprima live","Empfänger und Angaben":"Destinatario e dati","Positionen":"Voci","Einzelpreis":"Prezzo unitario","Menge":"Quantità","Preis":"Prezzo","Total":"Totale","Netto":"Netto","Rabatt":"Sconto","Brutto Positionen":"Lordo voci","Zwischentotal":"Subtotale","Einleitung":"Introduzione","Fällig":"Scadenza","Aktionen":"Azioni","Versand":"Invio","Empfänger":"Destinatario","Betreff":"Oggetto","Nachricht":"Messaggio","Demo-Versand ausführen":"Esegui invio demo",
"Die Eingaben werden für lokale Tests im Browser gespeichert.":"I dati vengono salvati nel browser per i test locali.","Für diesen Datentyp ist kein lokales Formular konfiguriert.":"Nessun modulo locale è configurato per questo tipo di dati.",
"Alle lokal erfassten Demo-Daten löschen?":"Eliminare tutti i dati demo salvati localmente?","Demo-Daten zurücksetzen":"Reimposta dati demo","Datensatz gelöscht.":"Record eliminato.","wurde lokal gespeichert.":"è stato salvato localmente.",
"Monatlich":"Mensile","Jährlich · 2 Monate gratis":"Annuale · 2 mesi gratis","Monat":"Mese","Jahr":"Anno","Preise":"Prezzi","Sicherheit":"Sicurezza","Funktionen":"Funzioni",
"Deine Firma":"La tua azienda","Unternehmen einordnen":"Profilo aziendale","Bereit zum Start":"Pronto per iniziare","Einrichtung":"Configurazione","Branche":"Settore","Geschäftliche E-Mail":"E-mail aziendale","Passwort":"Password",
"Abo abschliessen":"Completa abbonamento","Zahlungsdaten":"Dati di pagamento","Karteninhaber":"Intestatario carta","Kartennummer":"Numero carta","Gültig bis":"Scadenza","Zahlung simulieren und fortfahren":"Simula pagamento e continua","Es wird keine echte Zahlung verarbeitet.":"Non viene elaborato alcun pagamento reale."
};

const dictionaries={en,fr,it};

const commonWords:Record<Exclude<Locale,"de">,Record<string,string>>={
 en:{"Neu":"New","Offen":"Open","Aktiv":"Active","Inaktiv":"Inactive","Freigegeben":"Approved","Bezahlt":"Paid","Überfällig":"Overdue","Genehmigt":"Approved","Abgelehnt":"Rejected","Heute":"Today","Woche":"Week","Monat":"Month","Jahr":"Year","Tage":"Days","Stunden":"Hours","Firma":"Company","Kunde":"Customer","Projekt":"Project","Rechnung":"Invoice","Offerte":"Quote"},
 fr:{"Neu":"Nouveau","Offen":"Ouvert","Aktiv":"Actif","Inaktiv":"Inactif","Freigegeben":"Approuvé","Bezahlt":"Payé","Überfällig":"En retard","Genehmigt":"Approuvé","Abgelehnt":"Refusé","Heute":"Aujourd’hui","Woche":"Semaine","Monat":"Mois","Jahr":"Année","Tage":"Jours","Stunden":"Heures","Firma":"Entreprise","Kunde":"Client","Projekt":"Projet","Rechnung":"Facture","Offerte":"Offre"},
 it:{"Neu":"Nuovo","Offen":"Aperto","Aktiv":"Attivo","Inaktiv":"Inattivo","Freigegeben":"Approvato","Bezahlt":"Pagato","Überfällig":"Scaduto","Genehmigt":"Approvato","Abgelehnt":"Rifiutato","Heute":"Oggi","Woche":"Settimana","Monat":"Mese","Jahr":"Anno","Tage":"Giorni","Stunden":"Ore","Firma":"Azienda","Kunde":"Cliente","Projekt":"Progetto","Rechnung":"Fattura","Offerte":"Offerta"}
};

export function getLocale():Locale{
 if(typeof window==="undefined") return "de";
 const v=localStorage.getItem(KEY) as Locale|null;
 return v&&["de","en","fr","it"].includes(v)?v:"de";
}
export function setLocale(locale:Locale){
 localStorage.setItem(KEY,locale);
 window.dispatchEvent(new CustomEvent("binso-locale-changed",{detail:{locale}}));
}
export function translate(input:string, locale:Locale):string{
 if(locale==="de"||!input) return input;
 const dict=dictionaries[locale];
 const trimmed=input.trim();
 if(dict[trimmed]) return input.replace(trimmed,dict[trimmed]);
 let out=input;
 const entries=Object.entries(dict).sort((a,b)=>b[0].length-a[0].length);
 for(const [de,val] of entries){
   if(out.includes(de)) out=out.split(de).join(val);
 }
 for(const [de,val] of Object.entries(commonWords[locale])){
   out=out.replace(new RegExp(`\\b${de}\\b`,"g"),val);
 }
 return out;
}
export function tr(key:string, locale:Locale=getLocale()){return translate(key,locale)}
