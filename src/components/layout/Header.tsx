'use client'
import { Bell, Search } from 'lucide-react'

export default function Header({ title }: { title: string }) {
  return (
    <header
      className="h-14 flex items-center justify-between px-6 sticky top-0 z-20"
      style={{ background: '#111111', borderBottom: '1px solid #1E1E1E' }}
    >
      {/* Título com detalhe laranja */}
      <div className="flex items-center gap-2.5">
        <span style={{ width: 3, height: 18, background: '#F97316', borderRadius: 2, display: 'inline-block' }} />
        <h1 className="text-sm font-bold text-white tracking-wide uppercase">{title}</h1>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Busca */}
        <div className="relative hidden sm:block">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
          <input
            type="text"
            placeholder="Buscar..."
            className="input pl-8 text-xs h-8 w-44"
          />
        </div>

        {/* Notificação */}
        <button
          className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: '#1C1C1C', border: '1px solid #2A2A2A' }}
        >
          <Bell size={15} style={{ color: '#9CA3AF' }} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: '#F97316' }}
          />
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
          style={{ background: '#F97316', color: '#000' }}
        >
          AP
        </div>
      </div>
    </header>
  )
}
