import Shell from "@/components/shell";
import ModulePage from "@/components/module-page";
import { getModule } from "@/lib/modules";

export default function Page() {
  return <Shell><ModulePage config={getModule("offerten")} /></Shell>;
}
