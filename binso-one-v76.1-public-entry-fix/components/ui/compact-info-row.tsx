import type { ReactNode } from 'react'

type CompactInfoRowProps = {
  title: ReactNode
  meta: ReactNode
  amount?: ReactNode
  trailing?: ReactNode
  className?: string
}

export function CompactInfoRow({ title, meta, amount, trailing, className = '' }: CompactInfoRowProps) {
  return (
    <div className={`compact-info-row ${className}`.trim()}>
      <span className="compact-info-main">
        <strong>{title}</strong>
        <small>{meta}</small>
      </span>
      {amount != null && <strong className="compact-info-amount">{amount}</strong>}
      {trailing != null && <span className="compact-info-trailing">{trailing}</span>}
    </div>
  )
}
