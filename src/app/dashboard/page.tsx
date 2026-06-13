import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import DashboardViabilizze from './DashboardViabilizze'

export default function DashboardPage() {
  return (
    <AppLayout>
      <Header title="Dashboard" subtitle="Visão geral — VIABILIZZE" />
      <DashboardViabilizze />
    </AppLayout>
  )
}
