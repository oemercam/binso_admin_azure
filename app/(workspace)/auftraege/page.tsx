import ModulePage from "@/components/module-page";
import { getModule } from "@/lib/modules";

export default function Page() {
  return <ModulePage config={getModule("auftraege")} />;
}
