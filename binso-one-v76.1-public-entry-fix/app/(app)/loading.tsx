import { Skeleton } from '@/components/ui/skeleton'

export default function AppLoading() {
  return (
    <section className="page app-loading" aria-label="Inhalt wird geladen" aria-busy="true">
      <div className="app-loading-header">
        <Skeleton width={72} height={10} />
        <Skeleton width={190} height={24} />
        <Skeleton width="min(420px, 80%)" height={14} />
      </div>
      <div className="app-loading-metrics">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} height={84} />)}
      </div>
      <Skeleton height={220} />
    </section>
  )
}
