import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SAGA IT TYPE PARTY',
  description: 'SAGA IT COMMUNITY DAY 2027 向けのプログラミング用語タイピング。コミュニティごとの速さを競う。',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
