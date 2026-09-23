'use client'

import type { ReactNode } from 'react'
import { Toggle } from '@/components/ui/toggle'
import { Select } from '@/components/ui/form-controls'

type BaseProps = {
  title: string
  description?: string
}

export function SettingsValueRow({
  title,
  value,
  description,
  onClick,
}: BaseProps & { value?: string; onClick?: () => void }) {
  const content = (
    <>
      <span className="settings-value-copy">
        <strong>{title}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <span className="settings-value-trailing">
        {value ? <span className="settings-current-value">{value}</span> : null}
        {onClick ? <span className="settings-chevron" aria-hidden="true">›</span> : null}
      </span>
    </>
  )

  return onClick
    ? <button type="button" className="settings-value-row" onClick={onClick}>{content}</button>
    : <div className="settings-value-row settings-value-row-static">{content}</div>
}

export function SettingsToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: BaseProps & { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <div
      className={`settings-toggle-row${disabled ? ' is-disabled' : ' is-interactive'}`}
      onClick={(event) => {
        if (disabled || (event.target as HTMLElement).closest('button')) return
        onChange(!checked)
      }}
    >
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


export function SettingsSelectRow({
  title,
  description,
  value,
  onChange,
  children,
}: BaseProps & { value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <div className="settings-toggle-row is-interactive">
      <span className="settings-value-copy">
        <strong>{title}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <Select className="settings-inline-select" aria-label={title} value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </Select>
    </div>
  )
}
