export const limitsConfig = {
  maxFileUploadBytes: 10 * 1024 * 1024,
  maxDemoAttachmentBytes: 1_500_000,
  maxSupportRequestBytes: 1_500_000,
  maxSupportScreenshotDataUrlChars: 1_200_000,
  maxSupportScreenshotBytes: 900_000,
  supportAccessHours: 2,
  supportAccessMinHours: 1,
  supportAccessMaxHours: 8,
  stripeWebhookToleranceSeconds: 300,
} as const;

export const megabytes = (bytes:number) => Math.round((bytes / (1024 * 1024)) * 10) / 10;
