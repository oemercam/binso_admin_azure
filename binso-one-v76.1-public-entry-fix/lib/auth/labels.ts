import type { Role } from '@/types/domain'

const ROLE_LABELS: Record<Role, string> = {
  owner: 'Inhaber',
  admin: 'Administrator',
  finance: 'Buchhaltung',
  employee: 'Mitarbeiter',
}

export function roleLabel(role: Role) {
  return ROLE_LABELS[role]
}
