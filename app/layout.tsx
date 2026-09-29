import type {Metadata,Viewport} from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/service-worker-register";
import ClientProviders from "@/components/client-providers";

const siteUrl=process.env.NEXT_PUBLIC_SITE_URL??"https://www.binso.ch";
export const metadata:Metadata={
 metadataBase:new URL(siteUrl),
 title:{default:"Binso One – Schweizer KMU-Software",template:"%s · Binso One"},
 description:"Binso One bündelt Kunden, Offerten, Aufträge, Projekte, Zeiterfassung, Rechnungen, Finanzen und Administration für Schweizer KMU in einer zentralen Plattform.",
 applicationName:"Binso One",
 authors:[{name:"Binso GmbH",url:"https://www.binso.ch"}],
 creator:"Binso GmbH",publisher:"Binso GmbH",
 category:"Business software",
 keywords:["KMU Software Schweiz","ERP Schweiz","Projektmanagement Schweiz","Rechnungssoftware Schweiz","Zeiterfassung Schweiz","Binso One"],
 alternates:{canonical:"/"},
 manifest:"/manifest.webmanifest",
 appleWebApp:{capable:true,title:"Binso One",statusBarStyle:"black-translucent"},
 formatDetection:{telephone:false,address:false,email:false},
 openGraph:{type:"website",locale:"de_CH",url:"/",siteName:"Binso One",title:"Binso One – Schweizer KMU-Software",description:"Eine zentrale Plattform für Verkauf, Projekte, Finanzen, Personal und Administration von Schweizer KMU.",images:[{url:"/og/binso-one-1200x630.png",width:1200,height:630,alt:"Binso One – Schweizer KMU-Software"}]},
 twitter:{card:"summary_large_image",title:"Binso One – Schweizer KMU-Software",description:"Eine zentrale Plattform für Schweizer KMU.",images:["/og/binso-one-1200x630.png"]},
 icons:{icon:[{url:"/favicon.ico"},{url:"/icons/icon-48.png",sizes:"48x48",type:"image/png"},{url:"/brand/binso-icon-black.svg",type:"image/svg+xml"}],apple:[{url:"/icons/apple-touch-icon.png",sizes:"180x180",type:"image/png"}]},
 other:{"mobile-web-app-capable":"yes","apple-mobile-web-app-capable":"yes"}
};
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover",colorScheme:"light dark",themeColor:[{media:"(prefers-color-scheme: light)",color:"#ffffff"},{media:"(prefers-color-scheme: dark)",color:"#090909"}]};
const organizationJsonLd={"@context":"https://schema.org","@type":["Organization","LocalBusiness"],name:"Binso GmbH",alternateName:"Binso One",url:"https://www.binso.ch",logo:`${siteUrl}/icons/icon-512.png`,telephone:"+41 58 510 88 58",email:"info@binso.ch",address:{"@type":"PostalAddress",streetAddress:"Weissbadstrasse 8b",postalCode:"9050",addressLocality:"Appenzell",addressCountry:"CH"},identifier:{"@type":"PropertyValue",name:"UID",value:"CHE-173.401.068"}};
const softwareJsonLd={"@context":"https://schema.org","@type":"SoftwareApplication",name:"Binso One",applicationCategory:"BusinessApplication",operatingSystem:"Web, iOS PWA, Android PWA, Windows, macOS",url:siteUrl,publisher:{"@type":"Organization",name:"Binso GmbH"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="de-CH" data-app-version={process.env.NEXT_PUBLIC_APP_VERSION||"1.2.0"} suppressHydrationWarning><body><script type="application/ld+json">{JSON.stringify(organizationJsonLd)}</script><script type="application/ld+json">{JSON.stringify(softwareJsonLd)}</script><ServiceWorkerRegister/><ClientProviders>{children}</ClientProviders></body></html>}
