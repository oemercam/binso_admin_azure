"use client";
import LocaleProvider from "@/components/locale-provider";
import ToastHost from "@/components/toast-host";
import ConfirmHost from "@/components/confirm-host";
import CookieConsent from "@/components/privacy/cookie-consent";
import PilotFeedbackHost from "@/components/feedback/pilot-feedback-host";
import AnnouncementHost from "@/components/announcements/announcement-host";
import SupportTelemetryHost from "@/components/support/support-telemetry-host";
import ThemeProvider from "@/components/theme-provider";
import AppBootLoader from "@/components/app-boot-loader";
import ConnectivityBanner from "@/components/connectivity-banner";
import PwaUpdateNotice from "@/components/pwa-update-notice";
export default function ClientProviders({children}:{children:React.ReactNode}){
 return <ThemeProvider><LocaleProvider><AppBootLoader/><ConnectivityBanner/>{children}<PwaUpdateNotice/><AnnouncementHost/><SupportTelemetryHost/><PilotFeedbackHost/><CookieConsent/><ToastHost/><ConfirmHost/></LocaleProvider></ThemeProvider>
}
