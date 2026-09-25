import type { PlatformRole } from '@/types/domain'

export const PLATFORM_ROLES = [
  'platform_owner',
  'platform_admin',
  'platform_support',
  'platform_billing',
  'platform_auditor',
] as const satisfies readonly PlatformRole[]

export const PLATFORM_ROLE_GROUPS = {
  all: PLATFORM_ROLES,
  manage: ['platform_owner', 'platform_admin'],
  support: ['platform_owner', 'platform_admin', 'platform_support'],
  billing: ['platform_owner', 'platform_admin', 'platform_billing', 'platform_auditor'],
  audit: ['platform_owner', 'platform_admin', 'platform_auditor'],
  help: ['platform_owner', 'platform_admin', 'platform_support', 'platform_auditor'],
} as const satisfies Record<string, readonly PlatformRole[]>


export const PLATFORM_ROLE_OPTIONS = [
  { value: 'platform_owner', label: 'Platform Owner' },
  { value: 'platform_admin', label: 'Platform Admin' },
  { value: 'platform_support', label: 'Platform Support' },
  { value: 'platform_billing', label: 'Platform Billing' },
  { value: 'platform_auditor', label: 'Platform Auditor' },
] as const satisfies readonly { value: PlatformRole; label: string }[]

export function platformRoleLabel(role: PlatformRole | string | undefined) {
  return PLATFORM_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? 'Keine Plattformrolle'
}

export function platformRoleFromClaims(roles: readonly string[]): PlatformRole | undefined {
  const normalized = roles.map((role) => role.toLowerCase())
  const aliases: Record<PlatformRole, readonly string[]> = {
    platform_owner: ['platform_owner', 'platform.owner'],
    platform_admin: ['platform_admin', 'platform.admin'],
    platform_support: ['platform_support', 'platform.support'],
    platform_billing: ['platform_billing', 'platform.billing'],
    platform_auditor: ['platform_auditor', 'platform.auditor'],
  }
  for (const role of PLATFORM_ROLES) {
    if (normalized.some((value) => aliases[role].includes(value) || value.endsWith(`.${role}`))) return role
  }
  return undefined
}

export function isPlatformRole(value: unknown): value is PlatformRole {
  return typeof value === 'string' && (PLATFORM_ROLES as readonly string[]).includes(value)
}

export function hasPlatformRole(role: PlatformRole | string | undefined, allowed: readonly PlatformRole[]) {
  return Boolean(role && allowed.includes(role as PlatformRole))
}

export function canReadPlatform(role: PlatformRole | string | undefined) {
  return hasPlatformRole(role, PLATFORM_ROLE_GROUPS.all)
}

export function canManagePlatform(role: PlatformRole | string | undefined) {
  return hasPlatformRole(role, PLATFORM_ROLE_GROUPS.manage)
}

export function canSupportPlatform(role: PlatformRole | string | undefined) {
  return hasPlatformRole(role, PLATFORM_ROLE_GROUPS.support)
}

export function canAuditPlatform(role: PlatformRole | string | undefined) {
  return hasPlatformRole(role, PLATFORM_ROLE_GROUPS.audit)
}
