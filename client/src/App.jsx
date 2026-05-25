import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PublicHomePage from './pages/PublicHomePage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import MemberDashboardPage from './pages/MemberDashboardPage'
import AccountPage from './pages/AccountPage'
import NotificationsPage from './pages/NotificationsPage'
import VerifyPaymentPage from './pages/VerifyPaymentPage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './routes/ProtectedRoute'
import RoleRoute from './routes/RoleRoute'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<PublicHomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="account" element={<AccountPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="verify/:paymentId" element={<VerifyPaymentPage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={['admin', 'member']} />}>
            <Route path="member" element={<MemberDashboardPage />} />
          </Route>
        </Route>
        <Route path="dashboard" element={<Navigate to="/member" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
