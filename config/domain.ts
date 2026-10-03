export const domainConfig = {
  currency: "CHF",
  defaultLocaleTag: "de-CH",
  defaultPaymentDays: 30,
  defaultReminderDays: 10,
  trialDays: 14,
  demoSessionHours: 24,
  emailVerificationMinutes: 24 * 60,
  passwordResetMinutes: 30,
  invitationMinutes: 7 * 24 * 60,
  vatRates: [8.1, 2.6, 3.8, 0] as const,
  defaultVatRate: 8.1,
  fiscalYearStartMonth: 1,
  pilotFeedbackCooldownDays: 14,
  pilotFeedbackMinViews: 4,
  pilotFeedbackPromptDelayMs: 45_000,
  standardWorkdayStart: "08:00",
  standardWorkdayEnd: "17:00",
  standardBreakMinutes: 60,
  standardWorkdayHours: 8,
  standardWeeklyHours: 42,
  standardVacationDays: 25,
} as const;

export const milliseconds = {
  minute: 60_000,
  hour: 60 * 60_000,
  day: 24 * 60 * 60_000,
} as const;

export const planIds = ["start", "business", "pro"] as const;
export const billingCycles = ["monthly", "yearly"] as const;

export type PlanId = (typeof planIds)[number];
export type BillingCycle = (typeof billingCycles)[number];

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * milliseconds.day);
}

export function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * milliseconds.hour);
}

export function currentFiscalPeriod(date:Date=new Date()){
  const month=date.getMonth()+1;
  const quarter=Math.ceil(month/3);
  const year=date.getFullYear();
  return {year,quarter,label:`Q${quarter} ${year}`,monthLabel:new Intl.DateTimeFormat("de-CH",{month:"long",year:"numeric"}).format(date)};
}

export function isoDate(date:Date=new Date()){
  return date.toISOString().slice(0,10);
}

export function startOfCurrentWeekIso(date:Date=new Date()){
  const d=new Date(date);
  const day=(d.getDay()+6)%7;
  d.setDate(d.getDate()-day);
  d.setHours(0,0,0,0);
  return isoDate(d);
}

export function dueDateFrom(date:Date=new Date(),days:number=domainConfig.defaultPaymentDays){
  return isoDate(addDays(date,days));
}
