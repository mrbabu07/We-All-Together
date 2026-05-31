import { lazy, Suspense } from 'react'
import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import NProgress from 'nprogress'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import PageTransition from './components/ui/PageTransition'
import Skeleton from './components/ui/Skeleton'
import AdminRoute from './routes/AdminRoute'
import PrivateRoute from './routes/PrivateRoute'
import RoleRoute from './routes/RoleRoute'

const AccountPage = lazy(() => import('./pages/AccountPage'))
const AccountStatusPage = lazy(() => import('./pages/AccountStatusPage'))
const AdminControlsPage = lazy(() => import('./pages/AdminControlsPage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const AdminUnauthorizedPage = lazy(() => import('./pages/AdminUnauthorizedPage'))
const AuthenticatedLayout = lazy(() => import('./layouts/AuthenticatedLayout'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const MemberDashboardPage = lazy(() => import('./pages/MemberDashboardPage'))
const MemberDonatePage = lazy(() => import('./pages/MemberDonatePage'))
const MemberFeeHistoryPage = lazy(() => import('./pages/MemberFeeHistoryPage'))
const MemberVerifyPage = lazy(() => import('./pages/MemberVerifyPage'))
const MemberLayout = lazy(() => import('./layouts/MemberLayout'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const PublicHomePage = lazy(() => import('./pages/PublicHomePage'))
const PublicLayout = lazy(() => import('./layouts/PublicLayout'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const RolesPage = lazy(() => import('./pages/RolesPage'))
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

  useEffect(() => {
    NProgress.start()
    const timer = window.setTimeout(() => NProgress.done(), 180)

    return () => {
      window.clearTimeout(timer)
      NProgress.done()
    }
  }, [location.pathname, location.search])

  return (
    <Suspense fallback={<RouteFallback />}>
      <AnimatePresence mode="wait">
        <Routes key={location.pathname + location.search} location={location}>
          <Route element={<PublicLayout />}>
            <Route index element={page(<PublicHomePage />)} />
            <Route path="blog" element={page(<PublicHomePage />)} />
            <Route path="donate" element={page(<PublicHomePage />)} />
            <Route path="gallery" element={page(<PublicHomePage />)} />
            <Route path="notices" element={page(<PublicHomePage />)} />
            <Route path="notices/:noticeId" element={page(<PublicHomePage />)} />
            <Route path="member/verify/:memberId" element={page(<MemberVerifyPage />)} />
            <Route path="login" element={page(<LoginPage />)} />
            <Route path="register" element={page(<RegisterPage />)} />
            <Route path="*" element={page(<NotFoundPage />)} />
          </Route>
          <Route element={<PrivateRoute />}>
            <Route path="pending" element={page(<AccountStatusPage />)} />
            <Route path="rejected" element={page(<AccountStatusPage />)} />
            <Route path="suspended" element={page(<AccountStatusPage />)} />
            <Route element={<AuthenticatedLayout />}>
              <Route path="account" element={page(<AccountPage />)} />
              <Route path="member/profile" element={page(<AccountPage />)} />
              <Route path="member/notifications" element={page(<NotificationsPage />)} />
              <Route path="notifications" element={page(<NotificationsPage />)} />
            </Route>
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="admin" element={page(<AdminDashboardPage />)} />
                <Route path="admin/dashboard" element={page(<AdminDashboardPage />)} />
                <Route path="admin/unauthorized" element={page(<AdminUnauthorizedPage />)} />
                <Route path="admin/blogs" element={page(<AdminDashboardPage />)} />
                <Route path="admin/finance" element={page(<AdminDashboardPage />)} />
                <Route path="admin/finance/analytics" element={page(<AdminDashboardPage />)} />
                <Route path="admin/finance/donations" element={page(<AdminDashboardPage />)} />
                <Route path="admin/finance/expenses" element={page(<AdminDashboardPage />)} />
                <Route path="admin/finance/payments" element={page(<AdminDashboardPage />)} />
                <Route path="admin/finance/settings" element={page(<AdminDashboardPage />)} />
                <Route path="admin/gallery" element={page(<AdminDashboardPage />)} />
                <Route path="admin/meetings" element={page(<AdminDashboardPage />)} />
                <Route path="admin/members" element={page(<AdminDashboardPage />)} />
                <Route path="admin/notices" element={page(<AdminDashboardPage />)} />
                <Route path="admin/polls" element={page(<AdminDashboardPage />)} />
                <Route path="admin/rules" element={page(<AdminDashboardPage />)} />
                <Route path="admin/tours" element={page(<AdminDashboardPage />)} />
                <Route path="admin/achievements" element={page(<AdminControlsPage />)} />
                <Route path="admin/committee" element={page(<AdminControlsPage />)} />
                <Route path="admin/controls" element={page(<AdminControlsPage />)} />
                <Route path="admin/notifications" element={page(<AdminDashboardPage />)} />
                <Route path="admin/partners" element={page(<AdminControlsPage />)} />
                <Route path="admin/settings" element={page(<AdminControlsPage />)} />
                <Route path="admin/settings/appearance" element={page(<AdminControlsPage />)} />
                <Route path="admin/settings/org" element={page(<AdminControlsPage />)} />
                <Route path="admin/settings/roles" element={page(<RolesPage />)} />
                <Route path="admin/settings/security" element={page(<AdminControlsPage />)} />
                <Route path="admin/testimonials" element={page(<AdminControlsPage />)} />
                <Route path="verify/:paymentId" element={page(<VerifyPaymentPage />)} />
                <Route path="verify/receipt/:paymentId" element={page(<VerifyPaymentPage />)} />
              </Route>
            </Route>
            <Route element={<RoleRoute allowedRoles={['admin', 'member', 'moderator']} />}>
              <Route element={<MemberLayout />}>
                <Route path="member" element={page(<MemberDashboardPage />)} />
                <Route path="member/blogs" element={page(<MemberDashboardPage />)} />
                <Route path="member/dashboard" element={page(<MemberDashboardPage />)} />
                <Route path="member/donate" element={page(<MemberDonatePage />)} />
                <Route path="member/events" element={page(<MemberDashboardPage />)} />
                <Route path="member/fees" element={page(<MemberDashboardPage />)} />
                <Route path="member/fees/history" element={page(<MemberFeeHistoryPage />)} />
                <Route path="member/fee-history" element={page(<MemberFeeHistoryPage />)} />
                <Route path="member/gallery" element={page(<MemberDashboardPage />)} />
                <Route path="member/members" element={page(<MemberDashboardPage />)} />
                <Route path="member/notices" element={page(<MemberDashboardPage />)} />
                <Route path="member/polls" element={page(<MemberDashboardPage />)} />
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
