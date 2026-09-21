import {
  Icon,
  type IconName,
} from './icon'

export function StatCard({
  label,
  value,
  helper,
  icon,
  trend,
}: {
  label: string
  value: string
  helper: string
  icon: IconName
  trend?: string
}) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{label}</span>

        <span className="stat-icon">
          <Icon
            name={icon}
            size={16}
          />
        </span>
      </div>

      <strong>{value}</strong>

      <div className="stat-helper">
        {trend && (
          <span className="trend-positive">
            {trend}
          </span>
        )}

        <span>{helper}</span>
      </div>
    </article>
  )
}
