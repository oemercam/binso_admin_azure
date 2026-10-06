import { Logo } from "@/components/ui";

export default function Loading() {
  return <main className="app-launch-screen" aria-label="Binso One wird geladen" aria-live="polite">
    <div className="app-launch-brand">
      <Logo compact/>
      <span className="app-launch-pulse" aria-hidden="true"/>
    </div>
    <span className="sr-only">Binso One wird geladen.</span>
  </main>;
}
