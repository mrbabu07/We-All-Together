import { lazy, Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import PageTransition from './components/ui/PageTransition'
import Skeleton from './components/ui/Skeleton'
import ProtectedRoute from './routes/ProtectedRoute'
import RoleRoute from './routes/RoleRoute'

const AccountPage = lazy(() => import('./pages/AccountPage'))
const AdminControlsPage = lazy(() => import('./pages/AdminControlsPage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const AuthenticatedLayout = lazy(() => import('./layouts/AuthenticatedLayout'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const MemberDashboardPage = lazy(() => import('./pages/MemberDashboardPage'))
const MemberLayout = lazy(() => import('./layouts/MemberLayout'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const PublicHomePage = lazy(() => import('./pages/PublicHomePage'))
const PublicLayout = lazy(() => import('./layouts/PublicLayout'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const VerifyPaymentPage = lazy(() => import('./pages/VerifyPaymentPage'))

const page = (element) => <PageTransition>{element}</PageTransition>

function RouteFallback() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Skeleton rows={5} />
    </main>
  )
}

function App() {
  const location = useLocation()

  return (
    <Suspense fallback={<RouteFallback />}>
      <AnimatePresence mode="wait">
        <Routes key={location.pathname + location.search} location={location}>
          <Route element={<PublicLayout />}>
            <Route index element={page(<PublicHomePage />)} />
            <Route path="login" element={page(<LoginPage />)} />
            <Route path="register" element={page(<RegisterPage />)} />
            <Route path="*" element={page(<NotFoundPage />)} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<AuthenticatedLayout />}>
              <Route path="account" element={page(<AccountPage />)} />
              <Route path="notifications" element={page(<NotificationsPage />)} />
            </Route>
            <Route element={<RoleRoute allowedRoles={['admin']} />}>
              <Route element={<AdminLayout />}>
                <Route path="admin" element={page(<AdminDashboardPage />)} />
                <Route path="admin/controls" element={page(<AdminControlsPage />)} />
                <Route path="verify/:paymentId" element={page(<VerifyPaymentPage />)} />
              </Route>
            </Route>
            <Route element={<RoleRoute allowedRoles={['admin', 'member', 'moderator']} />}>
              <Route element={<MemberLayout />}>
                <Route path="member" element={page(<MemberDashboardPage />)} />
              </Route>
            </Route>
            <Route path="dashboard" element={<Navigate to="/member" replace />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}

export default App
