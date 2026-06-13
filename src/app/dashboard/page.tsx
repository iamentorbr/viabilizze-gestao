import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import DashboardClient from './DashboardClient'

export default function DashboardPage() {
  return (
    <AppLayout>
      <Header title="Dashboard" />
      <DashboardClient />
    </AppLayout>
  )
}
