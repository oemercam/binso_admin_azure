import Shell from "@/components/shell";
import EntityForm from "@/components/entity-form";

export default function Page() {
  return <Shell><EntityForm title="Neuer Auftrag" type="Auftrag" backHref="/auftraege" /></Shell>;
}
