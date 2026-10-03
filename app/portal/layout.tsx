import type { Metadata } from "next";

export const metadata:Metadata={
  title:"Kundenportal | Binso One",
  robots:{index:false,follow:false},
  manifest:"/manifest-portal.webmanifest",
};

export default function PortalLayout({children}:{children:React.ReactNode}){
  return children;
}
