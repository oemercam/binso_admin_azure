import DetailPage from "@/components/detail-page";
import { getModule } from "@/lib/modules";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DetailPage config={getModule("zahlungen")} id={id} />;
}
