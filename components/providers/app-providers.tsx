'use client'

import type { ReactNode } from 'react'
import { DeviceEnvironmentProvider } from '@/components/providers/device-environment-provider'
import { NetworkProvider } from '@/components/providers/network-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { NetworkStatus } from '@/components/ui/network-status'
import { PWAUpdateManager } from '@/components/pwa/pwa-update-manager'
import { FeedbackProvider } from '@/components/ui/feedback'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <DeviceEnvironmentProvider>
        <NetworkProvider>
          <FeedbackProvider>
            {children}
            <NetworkStatus />
            <PWAUpdateManager />
          </FeedbackProvider>
        </NetworkProvider>
      </DeviceEnvironmentProvider>
    </ThemeProvider>
  )
}
