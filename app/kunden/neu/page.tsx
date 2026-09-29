import Shell from "@/components/shell";
import EntityForm from "@/components/entity-form";

export default function Page() {
  return <Shell><EntityForm title="Neuen Kunden erfassen" type="Kunde" backHref="/kunden" /></Shell>;
}
