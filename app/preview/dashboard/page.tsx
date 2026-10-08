import type { Metadata } from "next";
import { DashboardPage } from "@/components/pages/dashboard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Binso One Produktvorschau",
};

export default function Page(){
  return <DashboardPage forceDemo/>;
}
