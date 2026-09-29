import Shell from "@/components/shell";
import EntityForm from "@/components/entity-form";

export default function Page() {
  return <Shell><EntityForm title="Spese erfassen" type="Spese" backHref="/spesen" /></Shell>;
}
