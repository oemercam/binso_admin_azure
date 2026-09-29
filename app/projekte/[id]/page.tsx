import Shell from "@/components/shell";
import DetailPage from "@/components/detail-page";
import { getModule } from "@/lib/modules";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Shell><DetailPage config={getModule("projekte")} id={id} /></Shell>;
}
