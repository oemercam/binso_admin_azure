import type { AppUser } from '@/types/domain'
export type Session = { user: AppUser; expiresAt?: string } | null
