import { Skeleton } from "@/components/ui";

export default function Loading() {
  return <main className="loading-shell" aria-label="Wird geladen">
    <aside className="loading-sidebar"><Skeleton className="skeleton-logo"/>{Array.from({length:7}).map((_,i)=><Skeleton className="skeleton-nav" key={i}/>)}</aside>
    <section className="loading-main"><Skeleton className="skeleton-title"/><Skeleton className="skeleton-subtitle"/><div className="loading-metrics">{Array.from({length:4}).map((_,i)=><Skeleton className="skeleton-metric" key={i}/>)}</div><Skeleton className="skeleton-panel"/></section>
  </main>;
}