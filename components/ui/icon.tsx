import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'dashboard'
  | 'customers'
  | 'quotes'
  | 'orders'
  | 'contracts'
  | 'time'
  | 'invoices'
  | 'finance'
  | 'accounting'
  | 'employees'
  | 'settings'
  | 'search'
  | 'menu'
  | 'close'
  | 'chevron'
  | 'plus'
  | 'bell'
  | 'command'
  | 'check'
  | 'warning'
  | 'money'
  | 'calendar'
  | 'user'
  | 'building'
  | 'briefcase'
  | 'receipt'
  | 'chart'
  | 'logout'
  | 'dots'
  | 'send'
  | 'edit'
  | 'copy'
  | 'download'
  | 'credit-card'
  | 'clock'
  | 'back'
  | 'remove'

export function Icon({
  name,
  size = 18,
  ...props
}: {
  name: IconName
  size?: number
} & SVGProps<SVGSVGElement>) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  const paths: Record<IconName, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    customers: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    quotes: <><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
    orders: <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></>,
    contracts: <><path d="M6 3h10l3 3v15H6z"/><path d="M16 3v4h4M9 11h7M9 15h7M9 19h4"/><path d="M4 7h2"/></>,
    time: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    invoices: <><path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></>,
    finance: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    accounting: <><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h4"/></>,
    employees: <><circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.5M18 14a5 5 0 0 1 3 4.5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.12-1.28l2-1.55-2-3.46-2.45 1A7.3 7.3 0 0 0 14.2 5.4L13.8 3h-4l-.4 2.4a7.3 7.3 0 0 0-2.23 1.3l-2.45-1-2 3.46 2 1.55A7 7 0 0 0 4.6 12c0 .44.04.87.12 1.28l-2 1.55 2 3.46 2.45-1a7.3 7.3 0 0 0 2.23 1.3l.4 2.4h4l.4-2.4a7.3 7.3 0 0 0 2.23-1.3l2.45 1 2-3.46-2-1.55c.08-.41.12-.84.12-1.28Z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    command: <><path d="M9 6V5a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v14a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3Z"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    warning: <><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v4M12 17h.01"/></>,
    money: <><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M17 14h.01M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    building: <><path d="M4 21V3h11v18M15 8h5v13M8 7h3M8 11h3M8 15h3M18 12h.01M18 16h.01M2 21h20"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18"/></>,
    receipt: <><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z"/><path d="M9 7h6M9 11h6M9 15h4"/></>,
    chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6"/></>,
    dots: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></>,
    'credit-card': <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    back: <path d="m15 18-6-6 6-6"/>,
    remove: <><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></>,
  }

  return <svg {...common} {...props}>{paths[name]}</svg>
}
