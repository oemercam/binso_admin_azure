import {SessionDataBoundary} from "./session-data-boundary";
import type { Metadata } from "next";

export const metadata:Metadata={
  applicationName:"Binso One",
  manifest:"/manifest-app.webmanifest",
  robots:{index:false,follow:false},
  appleWebApp:{capable:true,title:"Binso One",statusBarStyle:"default"},
  icons:{apple:[{url:"/brand/apple-touch-icon.png",type:"image/png",sizes:"180x180"}]},
};

export default function CustomerAppLayout({children}:{children:React.ReactNode}){
  return <SessionDataBoundary>{children}</SessionDataBoundary>;
}
