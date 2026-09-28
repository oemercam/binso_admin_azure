'use client'

import type { ReactNode } from 'react'
import { DeviceEnvironmentProvider } from '@/components/providers/device-environment-provider'
import { NetworkProvider } from '@/components/providers/network-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { NetworkStatus } from '@/components/ui/network-status'
import { PWAUpdateManager } from '@/components/pwa/pwa-update-manager'
import { FeedbackProvider } from '@/components/ui/feedback'
import { PersistenceFeedback } from '@/components/providers/persistence-feedback'
import { LanguageProvider } from '@/components/i18n/language-provider'
import { DomLocalizer } from '@/components/i18n/dom-localizer'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <DeviceEnvironmentProvider>
          <NetworkProvider>
            <FeedbackProvider>
              {children}
              <PersistenceFeedback />
              <NetworkStatus />
              <PWAUpdateManager />
            </FeedbackProvider>
          </NetworkProvider>
        </DeviceEnvironmentProvider>
      </ThemeProvider>
      <DomLocalizer />
    </LanguageProvider>
  )
}
