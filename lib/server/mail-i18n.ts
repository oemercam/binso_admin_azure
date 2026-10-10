import "server-only";

// The shared catalogue owns both public registration and transactional mail translations.
export {mailText,registrationText,registrationLocale,registrationMessages} from "@/lib/i18n";
export type {MailLocale,RegistrationTextKey} from "@/lib/i18n";
