import { Navigate, Route, Routes } from 'react-router-dom'
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
import AdminLayout from './layouts/AdminLayout'
import AuthenticatedLayout from './layouts/AuthenticatedLayout'
import MemberLayout from './layouts/MemberLayout'
import PublicLayout from './layouts/PublicLayout'

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<PublicHomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="account" element={<AccountPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
        <Route element={<RoleRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="verify/:paymentId" element={<VerifyPaymentPage />} />
          </Route>
        </Route>
        <Route element={<RoleRoute allowedRoles={['admin', 'member']} />}>
          <Route element={<MemberLayout />}>
            <Route path="member" element={<MemberDashboardPage />} />
          </Route>
        </Route>
        <Route path="dashboard" element={<Navigate to="/member" replace />} />
      </Route>
    </Routes>
  )
}

export default App
