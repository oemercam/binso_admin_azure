import type { Metadata } from "next";
import { TimePage } from "@/components/app-pages";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Binso One Zeiterfassung Vorschau",
};

export default function Page(){
  return <TimePage forceDemo/>;
}
