import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  ChevronUp,
  HeartHandshake,
  Home,
  LayoutDashboard,
  LogIn,
  Megaphone,
  Menu,
  Moon,
  PlayCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  X,
} from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import api, { getErrorMessage } from '../api/http'
import useAuth from '../hooks/useAuth'
import useTheme from '../hooks/useTheme'
import useTypewriter from '../hooks/useTypewriter'
import useAppStore from '../store/appStore'
import { ORG_NAME_BN, ORG_NAME_EN } from '../constants/brand'
import { readFileAsDataUrl } from '../utils/fileUtils'
import { isStaffUser } from '../utils/permissionUtils'

const PremiumHomeSections = lazy(() => import('../components/homepage/PremiumHomeSections'))

const DEFAULT_ORG_NAME = ORG_NAME_EN
const DEFAULT_TAGLINE = 'ঐক্য, সেবা ও স্বচ্ছতার আধুনিক কমিউনিটি প্ল্যাটফর্ম'
const DEFAULT_WELCOME =
  'দরগাহ পাড়া ঐক্য পরিষদ সদস্যপদ, নোটিশ, অর্থ ব্যবস্থাপনা এবং সামাজিক কার্যক্রমকে এক জায়গায় সহজভাবে পরিচালনা করে।'
const DEFAULT_PHRASES = [
  'একতায় আমরা, উন্নয়নে আমরা',
  'সেবায় নিবেদিত, সমাজের জন্য',
  'দরগাহ পাড়ার গর্ব, সবার পরিষদ',
]

const initialDonationForm = {
  amount: '1000',
  donorName: '',
  method: 'bKash',
  note: '',
  phone: '',
  proofImageUrl: '',
  transactionId: '',
}

const publicSectionIds = {
  '/blog': 'blog',
  '/donate': 'donate',
  '/gallery': 'gallery',
  '/notices': 'notices',
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, transition: { duration: 0.56, ease: 'easeOut' }, y: 0 },
}

const heroStagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const normalizeBangladeshPhone = (value = '') => {
  const phone = String(value).trim().replace(/[\s-]/g, '')

  if (phone.startsWith('+88')) return phone.slice(3)
  if (phone.startsWith('88') && phone.length === 13) return phone.slice(2)

  return phone
}

const bangladeshPhoneSchema = (label) =>
  z
    .string()
    .trim()
    .min(1, `${label} প্রয়োজন।`)
    .transform(normalizeBangladeshPhone)
    .refine((value) => /^01[3-9]\d{8}$/.test(value), `${label} 017XXXXXXXX ফরম্যাটে দিন।`)

const publicDonationSchema = z.object({
  amount: z.coerce.number().min(1, 'দানের পরিমাণ প্রয়োজন।'),
  donorName: z.string().trim().min(1, 'নাম প্রয়োজন।'),
  method: z.string().trim().min(1, 'পেমেন্ট মাধ্যম প্রয়োজন।'),
  note: z.string().trim().max(300, 'বার্তা ৩০০ অক্ষরের বেশি হতে পারবে না।').optional(),
  phone: bangladeshPhoneSchema('ফোন নম্বর'),
  proofImageUrl: z.string().trim().min(1, 'পেমেন্ট স্ক্রিনশট প্রয়োজন।'),
  transactionId: z.string().trim().min(1, 'ট্রানজেকশন আইডি প্রয়োজন।'),
})

const getList = (value) => (Array.isArray(value) ? value : [])

const plainText = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const resolveOrgName = (value) => {
  const text = String(value || '').trim()

  if (!text || text.toLowerCase() === 'dargah para oikko porishod') return ORG_NAME_EN

  return text
}

const pickNode = (response) => response?.data?.data || {}

const pickItems = (response, preferredKey = 'items') => {
  const node = pickNode(response)
  const candidates = [
    node[preferredKey],
    node.items,
    node.notices,
    node.meetings,
    node.tours,
    node.activities,
    node.donations,
    node.blogs,
    node.gallery,
    node.committee,
    node.achievements,
    node.testimonials,
    node.partners,
  ]

  return candidates.find(Array.isArray) || []
}

const safeGet = async (path) => {
  try {
    return await api.get(path)
  } catch {
    return null
  }
}

const cssVar = (name) => {
  const scope = document.querySelector('.premium-home') || document.documentElement
  return window.getComputedStyle(scope).getPropertyValue(name).trim()
}

const money = (value = 0) => `৳${Number(value || 0).toLocaleString('bn-BD')}`

const getDashboardPath = (user) => {
  if (!user) return '/login?returnUrl=/member/dashboard'
  return isStaffUser(user) ? '/admin/dashboard' : '/member/dashboard'
}

export default function PublicHomePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { noticeId } = useParams()
  const { user } = useAuth()
  const { previewAppearance } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [formMessage, setFormMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [uploadingDonationProof, setUploadingDonationProof] = useState(false)
  const [showBackTop, setShowBackTop] = useState(false)
  const [data, setData] = useState({
    achievements: [],
    activities: [],
    blogs: [],
    committee: [],
    donations: [],
    gallery: [],
    meetings: [],
    notices: [],
    partners: [],
    settings: {},
    testimonials: [],
    tickerNotices: [],
    tours: [],
  })

  const {
    control: donationControl,
    formState: { errors: donationErrors, isSubmitting: submittingDonation },
    handleSubmit: handleDonationSubmit,
    register: registerDonation,
    reset: resetDonation,
    setValue: setDonationValue,
  } = useForm({
    defaultValues: initialDonationForm,
    resolver: zodResolver(publicDonationSchema),
  })
  const donationForm = useWatch({ control: donationControl }) || initialDonationForm

  const loadPublicData = useCallback(async () => {
    setLoading(true)

    const [
      settingsResponse,
      noticesResponse,
      meetingsResponse,
      toursResponse,
      activitiesResponse,
      donationsResponse,
      blogsResponse,
      galleryResponse,
      committeeResponse,
      achievementsResponse,
      testimonialsResponse,
      partnersResponse,
      tickerResponse,
    ] = await Promise.all([
      safeGet('/public/settings'),
      safeGet('/public/notices?limit=6'),
      safeGet('/public/meetings?upcoming=true'),
      safeGet('/public/tours?upcoming=true'),
      safeGet('/public/activities'),
      safeGet('/public/donations'),
      safeGet('/public/blogs'),
      safeGet('/public/gallery?limit=6'),
      safeGet('/public/committee'),
      safeGet('/public/achievements'),
      safeGet('/public/testimonials'),
      safeGet('/public/partners'),
      safeGet('/public/notices?public=true&limit=5'),
    ])

    setData({
      achievements: pickItems(achievementsResponse),
      activities: pickItems(activitiesResponse),
      blogs: pickItems(blogsResponse, 'blogs'),
      committee: pickItems(committeeResponse),
      donations: pickItems(donationsResponse, 'donations'),
      gallery: pickItems(galleryResponse),
      meetings: pickItems(meetingsResponse),
      notices: pickItems(noticesResponse),
      partners: pickItems(partnersResponse),
      settings: pickNode(settingsResponse).settings || {},
      testimonials: pickItems(testimonialsResponse),
      tickerNotices: pickItems(tickerResponse),
      tours: pickItems(toursResponse),
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(loadPublicData, 0)
    return () => window.clearTimeout(timer)
  }, [loadPublicData])

  useEffect(() => {
    const handleScroll = () => setShowBackTop(window.scrollY > 400)
    const timer = window.setTimeout(handleScroll, 0)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const appearance = previewAppearance || data.settings.appearance || {}
  const siteSettings = data.settings.siteSettings || {}
  const homepageControls = data.settings.homepageControls || {}
  const orgName = resolveOrgName(siteSettings.orgName || DEFAULT_ORG_NAME)
  const tagline = siteSettings.tagline || DEFAULT_TAGLINE
  const aboutText = plainText(siteSettings.welcomeMessage) || DEFAULT_WELCOME
  const tickerEnabled = homepageControls.newsTickerEnabled !== false

  const homepageStats = useMemo(() => {
    const currentStats = data.settings.stats || {}
    const donationsTotal = data.donations.reduce(
      (sum, donation) => sum + Number(donation.amount || 0),
      0,
    )

    return {
      completedActivities: currentStats.completedActivities || data.activities.length || 12,
      totalMembers: currentStats.totalMembers || 84,
      yearlyDonation: currentStats.yearlyDonation || donationsTotal || 89589,
      yearsActive: currentStats.yearsActive || 5,
    }
  }, [data.activities.length, data.donations, data.settings.stats])

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    const events = [
      ...data.meetings.map((item) => ({
        ...item,
        date: item.meetingDate || item.date,
        eventType: 'meeting',
        location: item.location,
      })),
      ...data.tours.map((item) => ({
        ...item,
        date: item.startDate || item.date,
        eventType: 'tour',
        location: item.destination || item.location,
      })),
    ]

    return events
      .filter((item) => item.date && new Date(item.date) >= now)
      .sort((left, right) => new Date(left.date) - new Date(right.date))
      .slice(0, 3)
  }, [data.meetings, data.tours])

  useEffect(() => {
    const sectionId = publicSectionIds[location.pathname] || location.hash.replace('#', '')

    if (!sectionId || loading) return undefined

    const timer = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ block: 'start' })
    }, 120)

    return () => window.clearTimeout(timer)
  }, [loading, location.hash, location.pathname])

  useEffect(() => {
    document.title = `${ORG_NAME_EN} | ${ORG_NAME_BN}`
    upsertMeta('description', `${orgName} - ${ORG_NAME_BN} - ${tagline}`)
    upsertMeta('og:title', `${ORG_NAME_EN} | ${ORG_NAME_BN}`, 'property')
    upsertMeta('og:description', tagline, 'property')
    upsertMeta('og:image', '/pwa-icon.svg', 'property')
  }, [orgName, tagline])

  const uploadDonationProof = async (file) => {
    if (!file) return

    try {
      setFormMessage('')
      setUploadingDonationProof(true)
      const image = await readFileAsDataUrl(file)
      const response = await api.post('/public/uploads/payment-proof', {
        image,
        name: `public-donation-${Date.now()}`,
      })

      setDonationValue('proofImageUrl', response.data.data.image.url, {
        shouldDirty: true,
        shouldValidate: true,
      })
    } catch (error) {
      setFormMessage(getErrorMessage(error))
    } finally {
      setUploadingDonationProof(false)
    }
  }

  const submitDonation = async (values) => {
    setSuccessMessage('')
    setFormMessage('')

    try {
      await api.post('/public/donations', values)
      resetDonation(initialDonationForm)
      setSuccessMessage('ধন্যবাদ। আপনার দানের তথ্য যাচাইয়ের জন্য জমা হয়েছে।')
      confetti({
        colors: [cssVar('--primary-500'), cssVar('--primary-600'), cssVar('--primary-300')],
        particleCount: 120,
        spread: 72,
        startVelocity: 38,
      })
    } catch (error) {
      setFormMessage(getErrorMessage(error))
    }
  }

  const handleRsvp = async (event) => {
    if (!user) {
      navigate(`/login?returnUrl=${encodeURIComponent('/member/events')}`)
      return
    }

    if (event?.eventType === 'meeting' && event?._id) {
      try {
        await api.post(`/member/meetings/${event._id}/rsvp`, { status: 'coming' })
      } catch {
        navigate('/member/events')
        return
      }
    }

    navigate('/member/events')
  }

  if (siteSettings.maintenanceMode && user?.role !== 'admin') {
    return (
      <main className="premium-home grid min-h-screen place-items-center px-4 py-10">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="premium-card max-w-xl p-8 text-center"
          initial={{ opacity: 0, y: 16 }}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--success-bg)] text-[var(--accent-ui)]">
            <ShieldCheck aria-hidden="true" className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold text-[var(--text-primary)]">
            সাইট maintenance চলছে
          </h1>
          <p className="mt-3 text-base leading-8 text-[var(--text-secondary)]">
            আমরা কিছু আপডেট করছি। কিছুক্ষণ পরে আবার চেষ্টা করুন।
          </p>
        </motion.section>
      </main>
    )
  }

  return (
    <main
      className="premium-home min-h-screen overflow-hidden"
      style={{
        '--color-primary': appearance.primaryColor || 'var(--primary-600)',
      }}
    >
      <PremiumNavbar controls={homepageControls} user={user} />

      <NoticeTicker
        enabled={tickerEnabled}
        notices={data.tickerNotices.length ? data.tickerNotices : data.notices.slice(0, 5)}
      />

      <HeroSection
        orgName={orgName}
        phrases={homepageControls.typewriterPhrases}
        stats={homepageStats}
        tagline={tagline}
        tickerEnabled={tickerEnabled}
      />

      <Suspense fallback={<HomepageSkeleton />}>
        <PremiumHomeSections
          aboutText={aboutText}
          data={data}
          donation={{
            disabled: siteSettings.publicDonationsEnabled === false,
            errors: donationErrors,
            form: donationForm,
            message: formMessage,
            onAmount: (amount) =>
              setDonationValue('amount', String(amount), {
                shouldDirty: true,
                shouldValidate: true,
              })
            ,
            onProofUpload: uploadDonationProof,
            onSubmit: handleDonationSubmit(submitDonation),
            registerDonation,
            submitting: submittingDonation,
            successMessage,
            uploadingProof: uploadingDonationProof,
          }}
          homepageControls={homepageControls}
          loading={loading}
          noticeId={noticeId}
          onRsvp={handleRsvp}
          orgName={orgName}
          siteSettings={siteSettings}
          stats={homepageStats}
          tagline={tagline}
          upcomingEvents={upcomingEvents}
        />
      </Suspense>

      <WhatsAppFloat
        controls={homepageControls}
        settings={siteSettings}
        visible={showBackTop && homepageControls.whatsappButtonEnabled !== false}
      />
      <MobileBottomNav user={user} />
      <BackToTop visible={showBackTop} />
    </main>
  )
}

function upsertMeta(name, content, attr = 'name') {
  let tag = document.querySelector(`meta[${attr}="${name}"]`)

  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }

  tag.setAttribute('content', content)
}

function PremiumNavbar({ controls = {}, user }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('home')
  const showDarkToggle = controls.darkModeToggleEnabled !== false
  const links = useMemo(
    () => [
      ['হোম', '#home', 'home'],
      ['আমাদের সম্পর্কে', '#about', 'about'],
      ['সদস্যপদ', '#membership', 'membership'],
      ['দান', '#donate', 'donate'],
      ['যোগাযোগ', '#contact', 'contact'],
    ],
    [],
  )

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12)
    const timer = window.setTimeout(handleScroll, 0)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    const sections = links
      .map(([, , id]) => document.getElementById(id))
      .filter(Boolean)

    if (!sections.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible?.target?.id) setActive(visible.target.id)
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0.02 },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [links])

  return (
    <header className="premium-nav-shell fixed inset-x-0 top-0 z-50">
      <nav
        className={`premium-nav mx-auto flex h-16 max-w-7xl items-center justify-between border-b px-4 sm:px-6 ${
          scrolled ? 'premium-nav-scrolled' : ''
        }`}
      >
        <a className="flex min-w-0 items-center gap-3" href="#home">
          <span className="premium-logo-box">
            <Sparkles aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="grid min-w-0">
            <span className="truncate text-base font-semibold leading-tight text-[var(--text-primary)]">
              {ORG_NAME_EN}
            </span>
            <span className="truncate text-xs font-semibold leading-tight text-[var(--text-accent)]">
              {ORG_NAME_BN}
            </span>
          </span>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map(([label, href, id]) => (
            <a
              className={`premium-nav-link ${active === id ? 'premium-nav-link-active' : ''}`}
              href={href}
              key={href}
            >
              {label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {showDarkToggle ? <HomeThemeToggle /> : null}
          <Link className="premium-btn-outline min-h-11 px-5 text-sm" to="/login">
            <LogIn aria-hidden="true" className="h-4 w-4" />
            লগইন
          </Link>
          <Link className="premium-btn-primary min-h-11 px-5 text-sm" to={getDashboardPath(user)}>
            <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
            ড্যাশবোর্ড
          </Link>
        </div>

        <button
          aria-label="মেনু খুলুন"
          className="premium-icon-button premium-menu-button"
          onClick={() => setMenuOpen(true)}
          type="button"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 z-[60] bg-[var(--bg-base)] px-5 py-5 lg:hidden"
            exit={{ opacity: 0, y: -18 }}
            initial={{ opacity: 0, y: -18 }}
          >
            <div className="flex items-center justify-between">
              <a className="flex min-w-0 items-center gap-3" href="#home" onClick={() => setMenuOpen(false)}>
                <span className="premium-logo-box">
                  <Sparkles aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="grid min-w-0">
                  <span className="truncate font-semibold leading-tight text-[var(--text-primary)]">{ORG_NAME_EN}</span>
                  <span className="truncate text-xs font-semibold leading-tight text-[var(--text-accent)]">{ORG_NAME_BN}</span>
                </span>
              </a>
              <button
                aria-label="মেনু বন্ধ করুন"
                className="premium-icon-button"
                onClick={() => setMenuOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-10 grid gap-3">
              {links.map(([label, href]) => (
                <a
                  className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-4 text-lg font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-accent)] hover:text-[var(--text-accent)]"
                  href={href}
                  key={href}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="mt-8 grid gap-3">
              {showDarkToggle ? <HomeThemeToggle expanded /> : null}
              <Link
                className="premium-btn-outline min-h-12 justify-center"
                onClick={() => setMenuOpen(false)}
                to="/login"
              >
                <LogIn aria-hidden="true" className="h-4 w-4" />
                লগইন
              </Link>
              <Link
                className="premium-btn-primary min-h-12 justify-center"
                onClick={() => setMenuOpen(false)}
                to={getDashboardPath(user)}
              >
                <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
                ড্যাশবোর্ড
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}

function HomeThemeToggle({ expanded = false }) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const Icon = resolvedTheme === 'dark' ? Sun : Moon

  return (
    <button
      aria-label="থিম পরিবর্তন করুন"
      className={`premium-icon-button ${expanded ? 'w-full justify-center gap-2 px-4' : ''}`}
      onClick={toggleTheme}
      type="button"
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
      {expanded ? <span>{resolvedTheme === 'dark' ? 'লাইট মোড' : 'ডার্ক মোড'}</span> : null}
    </button>
  )
}

function NoticeTicker({ enabled, notices }) {
  const items = getList(notices).slice(0, 5)
  const visibleItems = items.length
    ? items
    : [
        { _id: 'fallback-1', title: 'সদস্য নিবন্ধন বুথ চালু আছে' },
        { _id: 'fallback-2', title: 'পরবর্তী কার্যক্রমের নোটিশ শীঘ্রই প্রকাশিত হবে' },
      ]

  if (!enabled) return null

  return (
    <div className="premium-ticker fixed inset-x-0 top-16 z-40 flex h-10 items-center overflow-hidden">
      <div className="flex h-full shrink-0 items-center gap-2 border-r border-white/35 px-4 font-bold text-white">
        <Megaphone aria-hidden="true" className="h-4 w-4" />
        <span>নোটিশ:</span>
      </div>
      <div className="group min-w-0 flex-1 overflow-hidden">
        <div className="premium-ticker-track flex w-max items-center gap-8 whitespace-nowrap px-6 group-hover:[animation-play-state:paused]">
          {[...visibleItems, ...visibleItems].map((notice, index) => (
            <a className="font-semibold text-white/95 hover:text-white" href="#notices" key={`${notice._id || notice.title}-${index}`}>
              {notice.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function HeroSection({ orgName, phrases, stats, tagline, tickerEnabled }) {
  const cleanPhrases = Array.isArray(phrases) && phrases.length ? phrases : DEFAULT_PHRASES
  const typewriterText = useTypewriter(cleanPhrases)

  return (
    <section
      className={`premium-hero relative isolate min-h-screen overflow-hidden px-4 sm:px-6 ${
        tickerEnabled ? 'pt-32' : 'pt-24'
      }`}
      id="home"
    >
      <div aria-hidden="true" className="premium-hero-grid" />
      <div aria-hidden="true" className="premium-blob premium-blob-1" />
      <div aria-hidden="true" className="premium-blob premium-blob-2" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 pb-20 pt-10 lg:grid-cols-[1.02fr_0.98fr] lg:pb-24 lg:pt-16">
        <motion.div animate="show" initial="hidden" variants={heroStagger}>
          <motion.div className="premium-hero-pill" variants={fadeUp}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary-400)] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--primary-400)]" />
            </span>
            দরগাহ পাড়া এলাকার ঐক্যের প্ল্যাটফর্ম
          </motion.div>

          <motion.h1
            className="mt-7 max-w-3xl text-[clamp(2.5rem,5vw,3.5rem)] font-bold leading-tight text-[var(--text-primary)]"
            variants={fadeUp}
          >
            একতায় আমরা,
            <span className="premium-gradient-text block">উন্নয়নে আমরা</span>
          </motion.h1>

          <motion.p className="mt-5 max-w-xl text-lg leading-9 text-[var(--text-secondary)]" variants={fadeUp}>
            {tagline || DEFAULT_WELCOME}
          </motion.p>

          <motion.div className="mt-5 min-h-8 text-lg font-semibold text-[var(--text-accent)]" variants={fadeUp}>
            {typewriterText}
            <span className="typewriter-cursor ml-1">|</span>
          </motion.div>

          <motion.div className="mt-8 flex flex-col gap-4 sm:flex-row" variants={fadeUp}>
            <Link className="premium-btn-primary premium-cta-primary min-h-14 px-8 py-3.5 text-base" to="/register">
              সদস্য হন
              <ArrowRight aria-hidden="true" className="h-5 w-5 transition group-hover:translate-x-[3px]" />
            </Link>
            <a className="premium-btn-secondary min-h-14 px-8 py-3.5 text-base" href="#about">
              <PlayCircle aria-hidden="true" className="h-5 w-5" />
              আরও জানুন
            </a>
          </motion.div>

          <motion.div className="mt-8 flex flex-wrap items-center gap-4 text-sm font-semibold text-[var(--text-secondary)]" variants={fadeUp}>
            <TrustItem icon={Users} text={`${Number(stats.totalMembers || 0).toLocaleString('bn-BD')}+ সক্রিয় সদস্য`} />
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-400)]" />
            <TrustItem icon={CalendarDays} text={`${Number(stats.yearsActive || 0).toLocaleString('bn-BD')}+ বছরের অভিজ্ঞতা`} />
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-400)]" />
            <TrustItem icon={HeartHandshake} text="সমাজসেবায় প্রতিশ্রুতিবদ্ধ" />
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="relative min-h-[520px]"
          initial={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <HeroGeometry stats={stats} orgName={orgName} />
        </motion.div>
      </div>
    </section>
  )
}

function TrustItem({ icon: Icon, text }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon aria-hidden="true" className="h-5 w-5 text-[var(--accent-ui)]" />
      {text}
    </span>
  )
}

function HeroGeometry({ orgName, stats }) {
  const initials = orgName
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 3)

  return (
    <div className="premium-hero-visual">
      <div aria-hidden="true" className="premium-shape premium-shape-circle" />
      <div aria-hidden="true" className="premium-shape premium-shape-rect" />
      <div aria-hidden="true" className="premium-shape premium-shape-block premium-shape-block-1" />
      <div aria-hidden="true" className="premium-shape premium-shape-block premium-shape-block-2" />
      <div aria-hidden="true" className="premium-shape premium-shape-cylinder premium-shape-cylinder-1" />
      <div aria-hidden="true" className="premium-shape premium-shape-cylinder premium-shape-cylinder-2" />
      <div className="premium-family-card float-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--success-bg)] text-[var(--accent-ui)]">
              <Home aria-hidden="true" className="h-5 w-5" />
            </span>
            আমাদের পরিবার
          </div>
          <span className="rounded-full bg-[var(--success-bg)] px-3 py-1 text-xs font-bold text-[var(--accent-ui)]">
            Active
          </span>
        </div>
        <div className="mt-6 flex items-center">
          {[initials || 'DP', 'আ', 'স', 'প'].map((item, index) => (
            <span
              className="premium-avatar-stack"
              key={`${item}-${index}`}
              style={{ transform: `translateX(-${index * 10}px)` }}
            >
              {item}
            </span>
          ))}
        </div>
        <p className="mt-6 font-[Inter] text-5xl font-bold text-[var(--accent-ui)]">
          {Number(stats.totalMembers || 0).toLocaleString('bn-BD')}+
        </p>
        <p className="mt-1 text-sm font-semibold text-[var(--text-secondary)]">সক্রিয় সদস্য</p>
        <div className="mt-6 grid gap-3">
          <StatRow label="এই মাসে যোগদান" value="১২ জন" />
          <StatRow label="মোট দান" value={money(stats.yearlyDonation)} />
          <StatRow label="পরবর্তী ইভেন্ট" value="শীঘ্রই" />
        </div>
      </div>
    </div>
  )
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--soft-row-bg)] px-4 py-3">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className="text-sm font-bold text-[var(--accent-ui)]">{value}</span>
    </div>
  )
}

function HomepageSkeleton() {
  return (
    <section className="premium-section bg-[var(--bg-base)]">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="home-skeleton-block h-48" key={index} />
        ))}
      </div>
    </section>
  )
}

function WhatsAppFloat({ controls = {}, settings = {}, visible }) {
  const rawNumber = controls.whatsappNumber || settings.whatsappNumber || settings.phone || ''
  const digits = String(rawNumber).replace(/\D/g, '')
  const normalized = digits.startsWith('880') ? digits : digits.startsWith('0') ? `88${digits}` : digits

  if (!normalized) return null

  return (
    <div className={`premium-sticky-whatsapp ${visible ? 'is-visible' : ''}`}>
      <a
        aria-label="আমাদের সাথে WhatsApp এ যোগাযোগ করুন"
        className="premium-whatsapp-button"
        href={`https://wa.me/${normalized}`}
        rel="noreferrer"
        target="_blank"
      >
        <Send aria-hidden="true" className="h-5 w-5" />
        <span className="premium-whatsapp-tooltip">আমাদের সাথে যোগাযোগ করুন</span>
      </a>
    </div>
  )
}

function BackToTop({ visible }) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          animate={{ opacity: 1, scale: 1, y: 0 }}
          aria-label="উপরে যান"
          className="fixed bottom-24 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-600)] text-white shadow-[var(--shadow-teal)] transition hover:bg-[var(--primary-700)] sm:bottom-8 sm:right-6"
          exit={{ opacity: 0, scale: 0.92, y: 8 }}
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          onClick={() => window.scrollTo({ behavior: 'smooth', top: 0 })}
          type="button"
        >
          <ChevronUp aria-hidden="true" className="h-5 w-5" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  )
}

function MobileBottomNav({ user }) {
  return (
    <nav className="premium-mobile-nav sm:hidden" aria-label="মোবাইল নেভিগেশন">
      <a href="#home">
        <Home aria-hidden="true" className="h-5 w-5" />
        হোম
      </a>
      <a href="#notices">
        <Megaphone aria-hidden="true" className="h-5 w-5" />
        নোটিশ
      </a>
      <a href="#donate">
        <HeartHandshake aria-hidden="true" className="h-5 w-5" />
        দান
      </a>
      <Link to={getDashboardPath(user)}>
        <LayoutDashboard aria-hidden="true" className="h-5 w-5" />
        ড্যাশবোর্ড
      </Link>
    </nav>
  )
}
