import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calculadora VIABILIZZE',
  description: 'Calculadora de Percentual de Polpa/Suco — Legislação MAPA IN 49/2018',
}

export default function CalculadoraViabilizzeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
