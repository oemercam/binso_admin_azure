import type {
  ReactNode,
  SVGProps,
} from 'react'

export type IconName =
  | 'dashboard'
  | 'customers'
  | 'orders'
  | 'time'
  | 'invoices'
  | 'finance'
  | 'settings'
  | 'search'
  | 'menu'
  | 'close'
  | 'chevron'
  | 'plus'
  | 'arrow-up'
  | 'arrow-down'
  | 'clock'
  | 'check'
  | 'warning'
  | 'money'
  | 'calendar'
  | 'user'
  | 'building'
  | 'briefcase'
  | 'receipt'
  | 'chart'

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
    dashboard: (
      <>
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="1.5"
        />
        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          rx="1.5"
        />
        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="1.5"
        />
        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="1.5"
        />
      </>
    ),

    customers: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),

    orders: (
      <>
        <rect
          x="4"
          y="3"
          width="16"
          height="18"
          rx="2"
        />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),

    time: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    invoices: (
      <>
        <path d="M6 2h9l4 4v16H6z" />
        <path d="M14 2v5h5M9 12h6M9 16h6" />
      </>
    ),

    finance: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),

    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.16.36.38.68.66.96.28.28.6.5.96.66H21v4h-.09A1.7 1.7 0 0 0 19.4 15z" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),

    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),

    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),

    chevron: (
      <path d="m9 18 6-6-6-6" />
    ),

    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),

    'arrow-up': (
      <>
        <path d="m7 11 5-5 5 5M12 6v12" />
      </>
    ),

    'arrow-down': (
      <>
        <path d="m7 13 5 5 5-5M12 18V6" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    check: (
      <path d="m5 12 4 4L19 6" />
    ),

    warning: (
      <>
        <path d="M12 3 2.8 20h18.4L12 3Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),

    money: (
      <>
        <rect
          x="3"
          y="6"
          width="18"
          height="12"
          rx="2"
        />
        <path d="M7 10h.01M17 14h.01M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      </>
    ),

    calendar: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),

    building: (
      <>
        <path d="M4 21V3h11v18M15 8h5v13M8 7h3M8 11h3M8 15h3M18 12h.01M18 16h.01M2 21h20" />
      </>
    ),

    briefcase: (
      <>
        <rect
          x="3"
          y="7"
          width="18"
          height="13"
          rx="2"
        />
        <path d="M8 7V4h8v3M3 12h18" />
      </>
    ),

    receipt: (
      <>
        <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z" />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </>
    ),

    chart: (
      <>
        <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
      </>
    ),
  }

  return (
    <svg
      {...common}
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
