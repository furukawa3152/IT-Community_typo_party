import type { Metadata } from 'next'

import { SettingsPanel } from '@/components/settings-panel'

export const metadata: Metadata = {
  title: '設定 | SAGA IT TYPE PARTY',
  robots: { index: false },
}

export default function SettingsPage() {
  return <SettingsPanel />
}
