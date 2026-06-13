import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VIABILIZZE — Sistema de Gestão',
  description: 'Sistema integrado de gestão para VIABILIZZE Consultoria',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f9fafb' }}>
        {children}
      </body>
    </html>
  )
}
