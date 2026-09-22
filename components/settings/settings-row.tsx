'use client'

import type { ReactNode } from 'react'
import { Toggle } from '@/components/ui/toggle'

type BaseProps = {
  title: string
  description?: string
}

export function SettingsValueRow({
  title,
  value,
  description,
  onClick,
}: BaseProps & { value?: string; onClick: () => void }) {
  return (
    <button type="button" className="settings-value-row" onClick={onClick}>
      <span className="settings-value-copy">
        <strong>{title}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <span className="settings-value-trailing">
        {value ? <span className="settings-current-value">{value}</span> : null}
        <span className="settings-chevron" aria-hidden="true">›</span>
      </span>
    </button>
  )
}

export function SettingsToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: BaseProps & { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <div className="settings-toggle-row">
      <span className="settings-value-copy">
        <strong>{title}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <Toggle label={title} checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="settings-progressive-section">
      <div className="settings-progressive-head">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="settings-progressive-list">{children}</div>
    </section>
  )
}
