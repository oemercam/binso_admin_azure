import { BinsoLogo } from '@/components/ui/binso-logo'

export default function Offline() {
  return (
    <main className="auth-page">
      <div className="auth-card apple-auth-card">
        <BinsoLogo />
        <h1>Keine Verbindung</h1>
        <p className="muted">Die App-Oberfläche ist verfügbar. Geschäftsdaten werden aus Sicherheitsgründen nicht offline zwischengespeichert.</p>
      </div>
    </main>
  )
}
