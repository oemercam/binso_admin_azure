import "server-only";

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
