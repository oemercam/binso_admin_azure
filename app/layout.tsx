import type {Metadata,Viewport} from "next";
import Script from "next/script";
import "./globals.css";
import ServiceWorkerRegister from "@/components/service-worker-register";
import ClientProviders from "@/components/client-providers";
import {absoluteUrl,siteConfig} from "@/lib/site-config";

export const metadata:Metadata={
 metadataBase:new URL(siteConfig.url),
 title:{default:"Binso One – Schweizer KMU-Software",template:"%s · Binso One"},
 description:siteConfig.description,
 applicationName:"Binso One",
 authors:[{name:siteConfig.company,url:siteConfig.url}],
 creator:siteConfig.company,publisher:siteConfig.company,
 category:"Business software",
 keywords:["KMU Software Schweiz","ERP Schweiz","Projektmanagement Schweiz","Rechnungssoftware Schweiz","Zeiterfassung Schweiz","Binso One"],
 alternates:{canonical:"/"},
 manifest:"/manifest-site.webmanifest",
 appleWebApp:{capable:true,title:"Binso One",statusBarStyle:"black-translucent"},
 formatDetection:{telephone:false,address:false,email:false},
 openGraph:{type:"website",locale:"de_CH",url:"/",siteName:"Binso One",title:"Binso One – Schweizer KMU-Software",description:"Eine zentrale Plattform für Verkauf, Projekte, Finanzen, Personal und Administration von Schweizer KMU.",images:[{url:"/og/binso-one-1200x630.png",width:1200,height:630,alt:"Binso One – Schweizer KMU-Software"}]},
 twitter:{card:"summary",title:"Binso One – Schweizer KMU-Software",description:"Eine zentrale Plattform für Schweizer KMU.",images:["/og/binso-one-1200x630.png"]},
 icons:{icon:[{url:"/favicon.ico"},{url:"/icons/icon-48.png",sizes:"48x48",type:"image/png"},{url:"/brand/binso-icon-black.svg",type:"image/svg+xml"}],apple:[{url:"/icons/apple-touch-icon.png",sizes:"180x180",type:"image/png"}]},
 other:{"mobile-web-app-capable":"yes","apple-mobile-web-app-capable":"yes"}
};
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",colorScheme:"light dark",themeColor:[{media:"(prefers-color-scheme: light)",color:"#ffffff"},{media:"(prefers-color-scheme: dark)",color:"#090909"}]};
const organizationJsonLd={"@context":"https://schema.org","@type":["Organization","LocalBusiness"],name:siteConfig.company,alternateName:siteConfig.name,url:siteConfig.url,logo:absoluteUrl("/icons/icon-512.png"),telephone:siteConfig.phoneDisplay,email:siteConfig.email,address:{"@type":"PostalAddress",streetAddress:siteConfig.address.street,postalCode:siteConfig.address.postalCode,addressLocality:siteConfig.address.city,addressCountry:siteConfig.address.countryCode},identifier:{"@type":"PropertyValue",name:"UID",value:siteConfig.uid}};
const softwareJsonLd={"@context":"https://schema.org","@type":"SoftwareApplication",name:siteConfig.name,applicationCategory:"BusinessApplication",operatingSystem:"Web, iOS PWA, Android PWA, Windows, macOS",url:siteConfig.url,publisher:{"@type":"Organization",name:siteConfig.company}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang={siteConfig.language} data-app-version={siteConfig.version} suppressHydrationWarning><body><Script src="/theme-init.js" strategy="beforeInteractive"/><script type="application/ld+json">{JSON.stringify(organizationJsonLd)}</script><script type="application/ld+json">{JSON.stringify(softwareJsonLd)}</script><ServiceWorkerRegister/><ClientProviders>{children}</ClientProviders></body></html>}
