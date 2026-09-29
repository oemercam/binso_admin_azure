import Shell from "@/components/shell";
import EntityForm from "@/components/entity-form";

export default function Page() {
  return <Shell><EntityForm title="Mitarbeiter erfassen" type="Mitarbeiter" backHref="/personal" /></Shell>;
}
