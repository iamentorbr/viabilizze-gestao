'use client'
import { Bell, Search } from 'lucide-react'

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-6"
      style={{
        background: '#f0f2f5',
        borderBottom: '1px solid #e8eaed',
        height: 56,
      }}
    >
      <div>
        <h1 className="text-lg font-bold" style={{ color: '#1a1d23', lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p className="text-xs" style={{ color: '#9aa0a6' }}>{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {/* Busca */}
        <div className="relative hidden sm:block">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9aa0a6' }} />
          <input
            type="text"
            placeholder="Buscar..."
            className="input pl-8 text-xs"
            style={{ height: 34, width: 180, background: '#fff', border: '1px solid #dadce0' }}
          />
        </div>

        {/* Notificação */}
        <button
          className="relative flex items-center justify-center rounded-lg transition-colors"
          style={{ width: 34, height: 34, background: '#fff', border: '1px solid #dadce0' }}
        >
          <Bell size={15} style={{ color: '#5f6368' }} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: '#F97316' }}
          />
        </button>
      </div>
    </header>
  )
}
