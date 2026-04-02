import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import CalendarPage from './pages/CalendarPage'
import DashboardPage from './pages/DashboardPage'
import DataTablePage from './pages/DataTablePage'
import NotificationsPage from './pages/NotificationsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="data" element={<DataTablePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
