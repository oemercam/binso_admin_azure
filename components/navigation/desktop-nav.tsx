import Link from 'next/link'
import { navItems } from './nav-items'
export function DesktopNav() {
  return <aside className="desktop-nav"><div className="brand"><span className="brand-mark">B</span><span><strong>Binso</strong><small>Admin</small></span></div><nav>{navItems.map(i => <Link key={i.href} href={i.href}><span aria-hidden>{i.icon}</span>{i.label}</Link>)}</nav></aside>
}
