import type {Metadata} from "next";
export const metadata:Metadata={title:{default:"Binso Admin",template:"%s · Binso Admin"},robots:{index:false,follow:false},manifest:"/manifest-operator.webmanifest"};
export default function OperatorLayout({children}:{children:React.ReactNode}){return children}
