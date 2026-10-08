import type { Metadata } from "next";
import { InvoicesPage } from "@/components/pages/finance";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Binso One Rechnungen Vorschau",
};

export default function Page(){
  return <InvoicesPage forceDemo/>;
}
