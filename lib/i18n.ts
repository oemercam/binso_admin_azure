export type MailLocale="de"|"en"|"fr"|"it"|"tr";

const messages={
 "E-Mail für Binso One bestätigen":{en:"Confirm your email for Binso One",fr:"Confirmez votre e-mail pour Binso One",it:"Conferma la tua e-mail per Binso One",tr:"Binso One için e-postanızı doğrulayın"},
 "Bitte bestätige deine E-Mail-Adresse:":{en:"Please confirm your email address:",fr:"Veuillez confirmer votre adresse e-mail :",it:"Conferma il tuo indirizzo e-mail:",tr:"Lütfen e-posta adresinizi doğrulayın:"},
 "E-Mail-Adresse bestätigen":{en:"Confirm email address",fr:"Confirmer l’adresse e-mail",it:"Conferma indirizzo e-mail",tr:"E-posta adresini doğrula"},
 "Bestätige deine geschäftliche E-Mail-Adresse, damit dein Binso-One-Konto vollständig aktiviert ist.":{en:"Confirm your business email address to fully activate your Binso One account.",fr:"Confirmez votre adresse e-mail professionnelle pour activer complètement votre compte Binso One.",it:"Conferma il tuo indirizzo e-mail aziendale per attivare completamente il tuo account Binso One.",tr:"Binso One hesabınızı tamamen etkinleştirmek için iş e-posta adresinizi doğrulayın."},
 "E-Mail bestätigen":{en:"Confirm email",fr:"Confirmer l’e-mail",it:"Conferma e-mail",tr:"E-postayı doğrula"},
} satisfies Record<string,Partial<Record<Exclude<MailLocale,"de">,string>>>;

export function mailText(source:string,locale:MailLocale){
 if(locale==="de")return source;
 return messages[source as keyof typeof messages]?.[locale]??source;
}

/** Registration UI and transactional mail consume the same locale catalogue. */
export const registrationMessages={
 language:['Sprache','Language','Langue','Lingua','Dil'],
 title:['Binso One einrichten','Set up Binso One','Configurer Binso One','Configura Binso One','Binso One kurulumu'],
 company:['Dein Unternehmen','Your company','Votre entreprise','La tua azienda','Şirketiniz'],
 companyHelp:['Beginne mit dem Namen deines Unternehmens.','Start with your company name.','Commencez par le nom de votre entreprise.','Inizia con il nome della tua azienda.','Şirketinizin adıyla başlayın.'],
 companyName:['Firmenname','Company name','Nom de l’entreprise','Nome dell’azienda','Şirket adı'],
 companyExample:['Meine Firma GmbH','My company Ltd','Mon entreprise Sàrl','La mia azienda Sagl','Şirketimin adı'],
 access:['Dein Zugang','Your access','Votre accès','Il tuo accesso','Hesabınız'],
 accessHelp:['Mit diesen Angaben meldest du dich später bei Binso One an.','Use these details to sign in to Binso One.','Ces informations vous permettront de vous connecter à Binso One.','Usa questi dati per accedere a Binso One.','Binso One’a bu bilgilerle giriş yapacaksınız.'],
 email:['Geschäftliche E-Mail-Adresse','Business email address','Adresse e-mail professionnelle','Indirizzo e-mail aziendale','İş e-posta adresi'],
 password:['Passwort','Password','Mot de passe','Password','Parola'],
 passwordHelp:['Mindestens 12 Zeichen.','At least 12 characters.','Au moins 12 caractères.','Almeno 12 caratteri.','En az 12 karakter.'],
 showPassword:['Passwort anzeigen','Show password','Afficher le mot de passe','Mostra password','Parolayı göster'],
 hidePassword:['Passwort ausblenden','Hide password','Masquer le mot de passe','Nascondi password','Parolayı gizle'],
 review:['Angaben bestätigen','Confirm your details','Confirmer les informations','Conferma i dati','Bilgileri onaylayın'],
 plan:['Tarif','Plan','Offre','Piano','Paket'],
 noPlan:['Kostenlos testen, Tarif später auswählen','Free trial; choose a plan later','Essai gratuit ; choisissez une offre plus tard','Prova gratuita; scegli il piano più tardi','Ücretsiz deneyin, paketi sonra seçin'],
 monthly:['Monatlich','Monthly','Mensuel','Mensile','Aylık'],
 yearly:['Jährlich','Yearly','Annuel','Annuale','Yıllık'],
 trial:['{days} Tage kostenlos testen','{days}-day free trial','Essai gratuit de {days} jours','Prova gratuita di {days} giorni','{days} gün ücretsiz deneme'],
 conditions:['Keine Kreditkarte erforderlich. Keine automatische Belastung. Ohne aktiviertes Abo nach der Testphase: Nur-Lesen; Daten bleiben erhalten. Die Testphase startet nach E-Mail-Bestätigung.','No credit card required. No automatic charge. Without an activated subscription after the trial: read-only access; your data is retained. The trial starts after email verification.','Aucune carte de crédit requise. Aucun prélèvement automatique. Sans abonnement activé après l’essai : accès en lecture seule ; vos données sont conservées. L’essai commence après la vérification de l’e-mail.','Nessuna carta di credito richiesta. Nessun addebito automatico. Senza abbonamento attivato dopo la prova: accesso in sola lettura; i dati vengono conservati. La prova inizia dopo la verifica dell’e-mail.','Kredi kartı gerekmez. Otomatik ödeme alınmaz. Denemeden sonra abonelik etkinleştirilmezse salt okunur erişim; verileriniz korunur. Deneme, e-posta doğrulandıktan sonra başlar.'],
 futurePrice:['Nach ausdrücklicher Abo-Aktivierung: CHF {amount} / {interval}.','After explicit subscription activation: CHF {amount} / {interval}.','Après activation explicite de l’abonnement : CHF {amount} / {interval}.','Dopo l’attivazione esplicita dell’abbonamento: CHF {amount} / {interval}.','Abonelik açıkça etkinleştirildikten sonra: CHF {amount} / {interval}.'],
 terms:['AGB','Terms','Conditions générales','Condizioni generali','Genel koşullar'],
 dpa:['Vereinbarung zur Auftragsbearbeitung','Data processing agreement','Accord de traitement des données','Accordo sul trattamento dei dati','Veri işleme sözleşmesi'],
 privacy:['Datenschutzerklärung','Privacy notice','Déclaration de protection des données','Informativa sulla privacy','Gizlilik bildirimi'],
 accept:['Ich akzeptiere die AGB und die Vereinbarung zur Auftragsbearbeitung.','I accept the terms and data processing agreement.','J’accepte les conditions générales et l’accord de traitement des données.','Accetto le condizioni generali e l’accordo sul trattamento dei dati.','Genel koşulları ve veri işleme sözleşmesini kabul ediyorum.'],
 create:['Konto erstellen','Create account','Créer le compte','Crea account','Hesap oluştur'],
 creating:['Konto wird erstellt…','Creating account…','Création du compte…','Creazione dell’account…','Hesap oluşturuluyor…'],
 next:['Weiter','Continue','Continuer','Continua','Devam'],
 back:['Zurück','Back','Retour','Indietro','Geri'],
 close:['Schliessen','Close','Fermer','Chiudi','Kapat'],
 cancel:['Abbrechen','Cancel','Annuler','Annulla','İptal'],
 progress:['Schritt {step} von {total} · {label}','Step {step} of {total} · {label}','Étape {step} sur {total} · {label}','Passaggio {step} di {total} · {label}','Adım {step} / {total} · {label}'],
 required:['* Pflichtfeld','* Required field','* Champ obligatoire','* Campo obbligatorio','* Zorunlu alan'],
 signIn:['Bereits registriert? Anmelden','Already registered? Sign in','Déjà inscrit ? Se connecter','Già registrato? Accedi','Zaten kayıtlı mısınız? Giriş yapın'],
 leaveTitle:['Einrichtung verlassen?','Leave setup?','Quitter la configuration ?','Uscire dalla configurazione?','Kurulumdan çıkılsın mı?'],
 leaveHelp:['Ungespeicherte Eingaben gehen verloren.','Unsaved details will be lost.','Les informations non enregistrées seront perdues.','I dati non salvati andranno persi.','Kaydedilmemiş bilgiler kaybolacak.'],
 keep:['Weiter bearbeiten','Keep editing','Continuer à modifier','Continua a modificare','Düzenlemeye devam et'],
 discard:['Verlassen und Änderungen verwerfen','Leave and discard changes','Quitter et abandonner les modifications','Esci e scarta le modifiche','Çık ve değişiklikleri sil'],
 verification:['Bestätige deine E-Mail-Adresse','Confirm your email address','Confirmez votre adresse e-mail','Conferma il tuo indirizzo e-mail','E-posta adresinizi doğrulayın'],
 sent:['Wir haben dir einen Bestätigungslink und einen Code gesendet.','We have sent you a verification link and a code.','Nous vous avons envoyé un lien de confirmation et un code.','Ti abbiamo inviato un link di conferma e un codice.','Size bir doğrulama bağlantısı ve kod gönderdik.'],
 deliveryFailed:['Die E-Mail konnte nicht versendet werden. Dein Konto ist angelegt. Bitte erneut senden oder später anmelden.','The email could not be sent. Your account has been created. Resend or sign in later.','L’e-mail n’a pas pu être envoyé. Votre compte a été créé. Renvoyez-le ou connectez-vous plus tard.','Non è stato possibile inviare l’e-mail. Il tuo account è stato creato. Reinvia o accedi più tardi.','E-posta gönderilemedi. Hesabınız oluşturuldu. Yeniden gönderin veya daha sonra giriş yapın.'],
 code:['Bestätigungscode','Verification code','Code de confirmation','Codice di conferma','Doğrulama kodu'],
 verify:['E-Mail bestätigen','Verify email','Confirmer l’e-mail','Conferma e-mail','E-postayı doğrula'],
 resend:['Erneut senden','Resend','Renvoyer','Reinvia','Yeniden gönder'],
 sending:['Wird verarbeitet…','Processing…','Traitement en cours…','Elaborazione…','İşleniyor…'],
 deliveryUnconfirmed:['Versand angefordert. Prüfe deinen Posteingang. Wenn keine E-Mail ankommt, versuche es später erneut.','Delivery requested. Check your inbox. If no email arrives, try again later.','Envoi demandé. Vérifiez votre boîte de réception. Si aucun e-mail n’arrive, réessayez plus tard.','Invio richiesto. Controlla la posta in arrivo. Se non arriva alcuna e-mail, riprova più tardi.','Gönderim istendi. Gelen kutunuzu kontrol edin. E-posta gelmezse daha sonra yeniden deneyin.'],
 resendSent:['Falls eine Bestätigung erforderlich ist, wurde eine neue E-Mail versendet.','If verification is required, a new email has been sent.','Si une confirmation est nécessaire, un nouvel e-mail a été envoyé.','Se è necessaria una conferma, è stata inviata una nuova e-mail.','Doğrulama gerekiyorsa yeni bir e-posta gönderildi.'],
 failure:['Der Vorgang konnte nicht abgeschlossen werden. Bitte prüfe deinen gespeicherten Stand oder versuche es später erneut.','The request could not be completed. Check your saved state or try again later.','L’opération n’a pas pu être terminée. Vérifiez votre état enregistré ou réessayez plus tard.','Non è stato possibile completare l’operazione. Controlla lo stato salvato o riprova più tardi.','İşlem tamamlanamadı. Kaydedilmiş durumu kontrol edin veya daha sonra yeniden deneyin.'],
 invalidCode:['Der Code oder Link ist ungültig oder abgelaufen. Bitte fordere eine neue E-Mail an.','The code or link is invalid or expired. Request a new email.','Le code ou le lien est invalide ou expiré. Demandez un nouvel e-mail.','Il codice o link non è valido o è scaduto. Richiedi una nuova e-mail.','Kod veya bağlantı geçersiz ya da süresi dolmuş. Yeni bir e-posta isteyin.'],
 conflict:['Bitte verwende die Anmeldung oder die Passwort-Wiederherstellung, um die Einrichtung sicher fortzusetzen.','Use sign-in or password recovery to continue setup securely.','Utilisez la connexion ou la récupération du mot de passe pour reprendre la configuration en toute sécurité.','Usa l’accesso o il recupero della password per continuare la configurazione in sicurezza.','Kuruluma güvenli şekilde devam etmek için giriş yapın veya parolayı kurtarın.'],
 verified:['E-Mail-Adresse bestätigt','Email address verified','Adresse e-mail confirmée','Indirizzo e-mail confermato','E-posta adresi doğrulandı'],
 alreadyVerified:['Die Bestätigung wurde bereits verarbeitet. Melde dich an, um fortzufahren.','Verification has already been processed. Sign in to continue.','La confirmation a déjà été traitée. Connectez-vous pour continuer.','La conferma è già stata elaborata. Accedi per continuare.','Doğrulama zaten işlendi. Devam etmek için giriş yapın.'],
 open:['Einrichtung fortsetzen','Continue setup','Continuer la configuration','Continua la configurazione','Kuruluma devam et'],
 loading:['Einrichtung wird geladen…','Loading setup…','Chargement de la configuration…','Caricamento della configurazione…','Kurulum yükleniyor…'],
 mailSubject:['E-Mail für Binso One bestätigen','Confirm your email for Binso One','Confirmez votre e-mail pour Binso One','Conferma la tua e-mail per Binso One','Binso One için e-postanızı doğrulayın'],
 mailCode:['Dein Bestätigungscode: {code}. Er ist {minutes} Minuten gültig.','Your verification code: {code}. It is valid for {minutes} minutes.','Votre code de confirmation : {code}. Il est valable {minutes} minutes.','Il tuo codice di conferma: {code}. È valido per {minutes} minuti.','Doğrulama kodunuz: {code}. {minutes} dakika geçerlidir.'],
 mailLink:['Der Bestätigungslink ist {hours} Stunden gültig.','The verification link is valid for {hours} hours.','Le lien de confirmation est valable {hours} heures.','Il link di conferma è valido per {hours} ore.','Doğrulama bağlantısı {hours} saat geçerlidir.'],
} satisfies Record<string,readonly [string,string,string,string,string]>;
export type RegistrationTextKey=keyof typeof registrationMessages;
const localeOrder=['de','en','fr','it','tr'] as const;
export function registrationLocale(value:unknown):MailLocale{
 const base=typeof value==='string'?value.toLowerCase().split('-')[0]:'';
 return localeOrder.includes(base as MailLocale)?base as MailLocale:'de';
}
export function registrationText(key:RegistrationTextKey,locale:MailLocale,values:Record<string,string|number>={}){
 const source=registrationMessages[key][localeOrder.indexOf(locale)];
 return source.replace(/\{(\w+)\}/g,(match,name)=>String(values[name]??match));
}
