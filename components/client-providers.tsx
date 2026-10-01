"use client";
import LocaleProvider from "@/components/locale-provider";
import ToastHost from "@/components/toast-host";
import ConfirmHost from "@/components/confirm-host";
import CookieConsent from "@/components/privacy/cookie-consent";
import ThemeProvider from "@/components/theme-provider";
import ConnectivityBanner from "@/components/connectivity-banner";
import PwaUpdateNotice from "@/components/pwa-update-notice";
import RouteScrollReset from "@/components/route-scroll-reset";
import MobileSplashGate from "@/components/mobile/mobile-splash-gate";
export default function ClientProviders({children}:{children:React.ReactNode}){
 return <ThemeProvider><LocaleProvider><MobileSplashGate/><RouteScrollReset/><ConnectivityBanner/>{children}<PwaUpdateNotice/><CookieConsent/><ToastHost/><ConfirmHost/></LocaleProvider></ThemeProvider>
}
