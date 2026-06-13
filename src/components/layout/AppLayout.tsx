import Sidebar from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: '#f0f2f5' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col" style={{ marginLeft: 224 }}>
        {children}
      </div>
    </div>
  )
}
