export const storageKeys = {
  locale: "binso-one-locale-v1",
  consent: "binso-cookie-consent",
  theme: "binso-theme",
  saasOrganizations: "binso-one-saas-orgs-v1",
  saasUsers: "binso-one-saas-users-v1",
  saasSession: "binso-one-saas-session-v1",
  demoRecords: "binso-one-demo-records-v2",
  demoSettings: "binso-one-demo-settings-v2",
  demoApp: "binso-one-demo-app-v1",
  supportTickets: "binso-support-tickets",
  pilotFeedback: "binso-pilot-feedback",
  supportEvents: "binso-support-events",
  timeTracker: "binso-time-tracker-v1",
  onboardingHidden: "binso-onboarding-hidden",
  feedbackNever: "binso-feedback-never",
  feedbackLast: "binso-feedback-last",
  feedbackViews: "binso-feedback-views",
} as const;

export const storagePrefixes = {
  announcement: "binso-announcement-",
  userScoped: ["binso-one-saas-", "binso-one-local-", "binso-local-", "binso-data-", "binso-records-"] as const,
} as const;

export function announcementStorageKey(id:string){
  return `${storagePrefixes.announcement}${id}`;
}
