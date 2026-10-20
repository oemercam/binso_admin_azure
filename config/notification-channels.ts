/** A saved preference does not constitute a working delivery implementation.
 * Web Push has no subscription/sender path yet; never advertise it as enabled. */
export const notificationChannels={email:true,push:false} as const;
