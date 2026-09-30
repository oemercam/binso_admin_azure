import BrandLogo from "@/components/ui/brand-logo";

export default function Loading(){
 return <main className="route-loading-page" role="status" aria-label="Ansicht wird geladen">
  <div className="route-loading-mark" aria-hidden="true"><BrandLogo compact/></div>
 </main>;
}
