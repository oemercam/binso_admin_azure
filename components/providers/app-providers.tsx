'use client'

import type { ReactNode } from 'react'
import { DeviceEnvironmentProvider } from '@/components/providers/device-environment-provider'
import { NetworkProvider } from '@/components/providers/network-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { NetworkStatus } from '@/components/ui/network-status'
import { PWAUpdateManager } from '@/components/pwa/pwa-update-manager'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <DeviceEnvironmentProvider>
        <NetworkProvider>
          {children}
          <NetworkStatus />
          <PWAUpdateManager />
        </NetworkProvider>
      </DeviceEnvironmentProvider>
    </ThemeProvider>
  )
}
