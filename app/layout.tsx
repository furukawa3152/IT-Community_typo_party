import type { Metadata, Viewport } from 'next'
import { M_PLUS_1, Martian_Mono } from 'next/font/google'
import './globals.css'

/** 日本語と画面の文字。可変ウェイト */
const sans = M_PLUS_1({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: false,
})

/** 打つ文字とタイム。幅も可変で、長いコードは詰めて組む */
const mono = Martian_Mono({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SAGA IT TYPE PARTY',
  description: 'SAGA IT COMMUNITY DAY 2027 向けのプログラミング用語タイピング。コミュニティごとの速さを競う。',
}

export const viewport: Viewport = {
  themeColor: '#f5f7fb',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
