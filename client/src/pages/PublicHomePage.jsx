import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronUp,
  Clock3,
  DollarSign,
  Globe2,
  Heart,
  HeartHandshake,
  MapPin,
  Menu,
  MessageCircle,
  PlayCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import api, { getErrorMessage } from '../api/http'
import {
  AchievementsSection,
  CommitteeSection,
  CookieConsentBanner,
  CountdownSection,
  FacebookPageSection,
  GalleryPreviewSection,
  GoogleMapSection,
  NewsTicker,
  NoticePreviewSection,
  PartnersSection,
  TestimonialsSection,
  TrustBadgeSection,
  WhatsAppFloatingButton,
  YoutubeSection,
} from '../components/homepage/HomepageExtras'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import FontSizeControl from '../components/ui/FontSizeControl'
import Skeleton from '../components/ui/Skeleton'
import ThemeToggle from '../components/ui/ThemeToggle'
import useAuth from '../hooks/useAuth'
import useTypewriter from '../hooks/useTypewriter'
import useAppStore from '../store/appStore'

const initialDonationForm = {
  amount: '1000',
  donorName: '',
  method: 'bKash',
  note: '',
  phone: '',
  transactionId: '',
}

const normalizeBangladeshPhone = (value = '') => {
  const phone = String(value).trim().replace(/[\s-]/g, '')

  if (phone.startsWith('+88')) {
    return phone.slice(3)
  }

  if (phone.startsWith('88') && phone.length === 13) {
    return phone.slice(2)
  }

  return phone
}

const bangladeshPhoneSchema = (label) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .transform(normalizeBangladeshPhone)
    .refine((value) => /^01[3-9]\d{8}$/.test(value), `${label} must use Bangladeshi format like 017XXXXXXXX.`)

const publicDonationSchema = z.object({
  amount: z.coerce.number().min(1, 'Donation amount is required.'),
  donorName: z.string().trim().min(1, 'Name is required.'),
  method: z.string().trim().min(1, 'Payment method is required.'),
  note: z.string().trim().max(300, 'Message cannot exceed 300 characters.').optional(),
  phone: bangladeshPhoneSchema('Phone'),
  transactionId: z.string().trim().min(1, 'Transaction ID is required.'),
})

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, transition: { duration: 0.55, ease: 'easeOut' }, y: 0 },
}

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const quickAmounts = [500, 1000, 2000, 5000]

const money = (value = 0) => `৳${Number(value || 0).toLocaleString('bn-BD')}`

const plainText = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const formatDate = (value) => {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

const formatTime = (value) => {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('bn-BD', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

const getMonthName = (value) =>
  value ? new Intl.DateTimeFormat('bn-BD', { month: 'short' }).format(new Date(value)) : ''

const estimateReadTime = (text = '') => Math.max(Math.ceil(plainText(text).split(' ').length / 180), 1)

const cssVar = (name) =>
  window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const publicSectionIds = {
  '/blog': 'blog',
  '/donate': 'donate',
  '/gallery': 'gallery',
  '/notices': 'notices',
}

export default function PublicHomePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { noticeId } = useParams()
  const { user } = useAuth()
  const { previewAppearance } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
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
    rules: [],
    settings: {},
    testimonials: [],
    tickerNotices: [],
    tours: [],
  })

  const loadPublicData = useCallback(async () => {
    setLoading(true)
    setMessage('')

    try {
      const [
        settingsResponse,
        noticesResponse,
        meetingsResponse,
        toursResponse,
        activitiesResponse,
        rulesResponse,
        donationsResponse,
        blogsResponse,
        galleryResponse,
        committeeResponse,
        achievementsResponse,
        testimonialsResponse,
        partnersResponse,
        tickerResponse,
      ] = await Promise.all([
        api.get('/public/settings'),
        api.get('/public/notices'),
        api.get('/public/meetings'),
        api.get('/public/tours'),
        api.get('/public/activities'),
        api.get('/public/rules'),
        api.get('/public/donations'),
        api.get('/public/blogs'),
        api.get('/public/gallery'),
        api.get('/public/committee'),
        api.get('/public/achievements'),
        api.get('/public/testimonials'),
        api.get('/public/partners'),
        api.get('/public/notices?limit=5'),
      ])

      setData({
        achievements: achievementsResponse.data.data.items,
        activities: activitiesResponse.data.data.items,
        blogs: blogsResponse.data.data.blogs,
        committee: committeeResponse.data.data.items,
        donations: donationsResponse.data.data.donations,
        gallery: galleryResponse.data.data.items,
        meetings: meetingsResponse.data.data.items,
        notices: noticesResponse.data.data.items,
        partners: partnersResponse.data.data.items,
        rules: rulesResponse.data.data.items,
        settings: settingsResponse.data.data.settings,
        testimonials: testimonialsResponse.data.data.items,
        tickerNotices: tickerResponse.data.data.items,
        tours: toursResponse.data.data.items,
      })
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
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

  useEffect(() => {
    const sectionId = publicSectionIds[location.pathname]

    if (!sectionId || loading) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ block: 'start' })
    }, 80)

    return () => window.clearTimeout(timer)
  }, [loading, location.pathname])

  const appearance = previewAppearance || data.settings.appearance || {}
  const siteSettings = data.settings.siteSettings || {}
  const homepageControls = data.settings.homepageControls || {}
  const orgName = siteSettings.orgName || 'দরগাহ পাড়া ঐক্য পরিষদ'
  const tagline = siteSettings.tagline || 'ঐক্য, সেবা ও স্বচ্ছতা'
  const aboutText =
    plainText(siteSettings.welcomeMessage) ||
    'দরগাহ পাড়া ঐক্য পরিষদ এলাকার মানুষের পাশে দাঁড়ানো, শিক্ষামূলক কার্যক্রম পরিচালনা, সামাজিক উন্নয়ন এবং স্বচ্ছ সংগঠন ব্যবস্থাপনার জন্য কাজ করে।'

  const homepageStats = useMemo(
    () => {
      const currentStats = data.settings.stats || {}

      return {
        completedActivities: currentStats.completedActivities || data.activities.length,
        totalMembers: currentStats.totalMembers || 84,
        yearlyDonation:
          currentStats.yearlyDonation ||
          data.donations.reduce((sum, donation) => sum + Number(donation.amount || 0), 0),
        yearsActive: currentStats.yearsActive || 5,
      }
    },
    [data.activities.length, data.donations, data.settings.stats],
  )

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    const events = [
      ...data.meetings.map((item) => ({
        ...item,
        date: item.meetingDate,
        eventType: 'meeting',
        location: item.location,
      })),
      ...data.tours.map((item) => ({
        ...item,
        date: item.startDate,
        eventType: 'tour',
        location: item.destination,
      })),
    ]

    return events
      .filter((item) => item.date && new Date(item.date) >= now)
      .sort((left, right) => new Date(left.date) - new Date(right.date))
      .slice(0, 3)
  }, [data.meetings, data.tours])

  useEffect(() => {
    document.title = `${orgName} | ${tagline}`
    upsertMeta('description', `${orgName} - ${tagline}. সদস্যপদ, দান, নোটিশ ও সামাজিক কার্যক্রম।`)
    upsertMeta('og:title', orgName, 'property')
    upsertMeta('og:description', tagline, 'property')
    upsertMeta('og:image', '/pwa-icon.svg', 'property')
  }, [orgName, tagline])

  const submitDonation = async (values) => {
    setSuccessMessage('')
    setMessage('')

    try {
      await api.post('/public/donations', values)
      resetDonation(initialDonationForm)
      setSuccessMessage('ধন্যবাদ। আপনার দানের তথ্য যাচাইয়ের জন্য জমা হয়েছে।')
      confetti({
        colors: [cssVar('--brand-600'), cssVar('--success'), cssVar('--warning')],
        particleCount: 110,
        spread: 70,
        startVelocity: 38,
      })
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const handleRsvp = () => {
    if (!user) {
      navigate('/login')
      return
    }

    navigate('/member/events')
  }

  if (siteSettings.maintenanceMode && user?.role !== 'admin') {
    return (
      <main className="grid min-h-screen place-items-center bg-gray-50 px-4 py-10">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm"
          initial={{ opacity: 0, y: 16 }}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <ShieldCheck aria-hidden="true" className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-gray-900">
            সাইট maintenance চলছে
          </h1>
          <p className="mt-3 text-base leading-8 text-gray-500">
            আমরা কিছু আপডেট করছি। কিছুক্ষণ পরে আবার চেষ্টা করুন।
          </p>
        </motion.section>
      </main>
    )
  }

  return (
    <main
      className="overflow-hidden bg-white text-gray-900"
      style={{
        '--color-primary': appearance.primaryColor || 'var(--brand-600)',
      }}
    >
      <HomepageNavbar controls={homepageControls} orgName={orgName} user={user} />

      <NewsTicker
        enabled={homepageControls.newsTickerEnabled !== false}
        notices={data.tickerNotices.length ? data.tickerNotices : data.notices.slice(0, 5)}
      />

      <HeroSection
        orgName={orgName}
        phrases={homepageControls.typewriterPhrases}
        stats={homepageStats}
        tagline={tagline}
      />

      <StatsSection stats={homepageStats} />

      <CountdownSection
        enabled={homepageControls.countdownEnabled !== false}
        event={upcomingEvents[0]}
      />

      <AboutSection aboutText={aboutText} orgName={orgName} tagline={tagline} />

      <TrustBadgeSection controls={homepageControls} orgName={orgName} />

      <CommitteeSection
        enabled={homepageControls.committeeEnabled !== false}
        members={data.committee}
      />

      <AchievementsSection
        enabled={homepageControls.achievementsEnabled !== false}
        items={data.achievements}
      />

      <NoticePreviewSection
        initialNoticeId={noticeId}
        loading={loading}
        notices={data.notices}
      />

      <EventsSection events={upcomingEvents} loading={loading} onRsvp={handleRsvp} />

      <DonationSection
        disabled={siteSettings.publicDonationsEnabled === false}
        errors={donationErrors}
        form={donationForm}
        message={message}
        onAmount={(amount) =>
          setDonationValue('amount', String(amount), {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        onSubmit={handleDonationSubmit(submitDonation)}
        registerDonation={registerDonation}
        settings={data.settings}
        submitting={submittingDonation}
        successMessage={successMessage}
      />

      <GalleryPreviewSection
        downloadEnabled={homepageControls.galleryDownloadEnabled !== false}
        gallery={data.gallery}
        loading={loading}
      />

      <TestimonialsSection
        enabled={homepageControls.testimonialsEnabled !== false}
        items={data.testimonials}
      />

      <YoutubeSection controls={homepageControls} />

      <BlogSection blogs={data.blogs} loading={loading} />

      <PartnersSection
        enabled={homepageControls.partnersEnabled !== false}
        partners={data.partners}
      />

      <FacebookPageSection controls={homepageControls} />

      <MembershipCta />

      <GoogleMapSection
        controls={homepageControls}
        orgName={orgName}
        siteSettings={siteSettings}
      />

      <HomepageFooter
        notices={data.notices}
        orgName={orgName}
        settings={siteSettings}
        tagline={tagline}
      />

      <WhatsAppFloatingButton controls={homepageControls} siteSettings={siteSettings} />

      <CookieConsentBanner enabled={homepageControls.cookieConsentEnabled !== false} />

      <AnimatePresence>
        {showBackTop ? (
          <motion.button
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700"
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            onClick={() => window.scrollTo({ behavior: 'smooth', top: 0 })}
            type="button"
          >
            <ChevronUp aria-hidden="true" className="h-5 w-5" />
          </motion.button>
        ) : null}
      </AnimatePresence>
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

function HomepageNavbar({ controls = {}, orgName, user }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const showDarkToggle = controls.darkModeToggleEnabled !== false
  const showFontControls = controls.fontSizeControlsEnabled !== false
  const links = [
    ['হোম', '#home'],
    ['আমাদের সম্পর্কে', '#about'],
    ['সদস্যপদ', '#membership'],
    ['দান', '#donate'],
    ['যোগাযোগ', '#contact'],
  ]

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16)
    const timer = window.setTimeout(handleScroll, 0)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-md' : 'bg-white/0'
      }`}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a className="flex items-center gap-3" href="#home">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20">
            <Sparkles aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="max-w-48 truncate text-base font-semibold tracking-tight text-gray-950 sm:max-w-none">
            {orgName}
          </span>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map(([label, href]) => (
            <a
              className="group relative text-sm font-semibold text-gray-600 transition hover:text-indigo-700"
              href={href}
              key={href}
            >
              {label}
              <span className="absolute -bottom-2 left-0 h-0.5 w-0 rounded-full bg-indigo-600 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {showDarkToggle ? <ThemeToggle /> : null}
          {showFontControls ? <FontSizeControl /> : null}
          <Link className="inline-flex min-h-11 items-center rounded-xl border border-gray-300 px-5 text-sm font-semibold text-gray-800 transition hover:bg-white" to="/login">
            লগইন
          </Link>
          <Link className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700" to={user ? (user.role === 'admin' ? '/admin' : '/member') : '/register'}>
            {user ? 'ড্যাশবোর্ড' : 'নিবন্ধন করুন'}
          </Link>
        </div>

        <button
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white/70 text-gray-800 lg:hidden"
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
            className="fixed inset-0 z-[60] bg-white px-6 py-6 lg:hidden"
            exit={{ opacity: 0, y: -18 }}
            initial={{ opacity: 0, y: -18 }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-950">{orgName}</span>
              <button
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700"
                onClick={() => setMenuOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-10 grid gap-3">
              {links.map(([label, href]) => (
                <a
                  className="rounded-2xl px-4 py-4 text-lg font-semibold text-gray-800 transition hover:bg-indigo-50 hover:text-indigo-700"
                  href={href}
                  key={href}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="mt-8 grid gap-3">
              {showDarkToggle ? <ThemeToggle className="w-full" showLabel /> : null}
              {showFontControls ? <FontSizeControl className="w-full justify-center" /> : null}
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-300 text-sm font-semibold text-gray-800"
                onClick={() => setMenuOpen(false)}
                to="/login"
              >
                লগইন
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white"
                onClick={() => setMenuOpen(false)}
                to="/register"
              >
                নিবন্ধন করুন
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}

function HeroSection({ orgName, phrases, stats, tagline }) {
  const memberFaces = ['আ', 'ম', 'স', 'র', 'ন']
  const typedHeading = useTypewriter(phrases)

  return (
    <section
      className="relative min-h-screen overflow-hidden bg-white pt-28"
      id="home"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle,var(--brand-200)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute right-0 top-0 h-72 w-72 rounded-bl-[120px] bg-indigo-50 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-80 w-80 rounded-tr-[140px] bg-violet-50 blur-3xl" />
      <div className="relative mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl items-center gap-12 px-4 pb-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          animate="show"
          className="max-w-2xl"
          initial="hidden"
          variants={stagger}
        >
          <motion.span
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20"
            variants={fadeUp}
          >
            ✦ দরগাহ পাড়া এলাকার গর্ব
          </motion.span>
          <motion.h1
            className="mt-7 text-5xl font-bold leading-tight tracking-tight text-gray-950 sm:text-6xl lg:text-[64px]"
            variants={fadeUp}
          >
            <span className="text-indigo-700">{typedHeading}</span>
            <span className="typewriter-cursor text-indigo-500">|</span>
          </motion.h1>
          <motion.p className="mt-6 max-w-xl text-lg leading-9 text-gray-600" variants={fadeUp}>
            {orgName} — আমাদের এলাকার সকল মানুষের সেবায় নিবেদিত একটি সংগঠন। {tagline}
          </motion.p>
          <motion.div className="mt-8 flex flex-wrap gap-4" variants={fadeUp}>
            <Link className="inline-flex min-h-14 items-center gap-3 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-600/20 transition hover:bg-indigo-700" to="/register">
              সদস্য হোন
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
            <a className="inline-flex min-h-14 items-center gap-3 rounded-xl border border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-800 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700" href="#about">
              <PlayCircle aria-hidden="true" className="h-5 w-5" />
              আরও জানুন
            </a>
          </motion.div>
          <motion.div
            className="mt-8 grid gap-3 text-sm font-semibold text-gray-600 sm:flex sm:flex-wrap sm:items-center sm:gap-5"
            variants={fadeUp}
          >
            <TrustItem icon={Users} text={`${stats.totalMembers}+ সক্রিয় সদস্য`} />
            <TrustItem icon={CalendarDays} text={`${stats.yearsActive}+ বছরের অভিজ্ঞতা`} />
            <TrustItem icon={Heart} text="সমাজসেবায় প্রতিশ্রুতিবদ্ধ" />
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative"
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          transition={{ delay: 0.25, duration: 0.6, ease: 'easeOut' }}
        >
          <div className="absolute inset-8 rounded-[3rem] bg-gradient-to-br from-indigo-100 via-white to-violet-100 blur-2xl" />
          <div className="relative rounded-[2rem] border border-indigo-100 bg-white p-6 shadow-2xl shadow-indigo-950/10 sm:p-8">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white">
              <div className="flex -space-x-4">
                {memberFaces.map((face) => (
                  <span
                    className="inline-flex h-14 w-14 items-center justify-center rounded-full border-4 border-indigo-600 bg-white text-lg font-bold text-indigo-700"
                    key={face}
                  >
                    {face}
                  </span>
                ))}
              </div>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight">আমাদের পরিবারে যোগ দিন</h2>
              <p className="mt-2 text-indigo-100">সদস্যপদ, দায়িত্ব, স্বচ্ছতা এবং এলাকার উন্নয়নের একত্র যাত্রা।</p>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-5">
                <p className="text-sm text-gray-500">Live member count</p>
                <p className="mt-2 text-4xl font-bold tracking-tight text-gray-950">
                  <AnimatedCounter value={stats.totalMembers} />+
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-5">
                <CheckCircle2 aria-hidden="true" className="h-6 w-6 text-emerald-600" />
                <p className="mt-3 font-semibold text-emerald-900">নিরাপদ ও বিশ্বস্ত</p>
                <p className="mt-1 text-sm text-emerald-700">Admin verified records</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 left-4 rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-xl">
            ✓ নিরাপদ ও বিশ্বস্ত
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function TrustItem({ icon: Icon, text }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon aria-hidden="true" className="h-4 w-4 text-indigo-600" />
      {text}
    </span>
  )
}

function StatsSection({ stats }) {
  const rows = [
    ['মোট সদস্য', stats.totalMembers, '+', Users],
    ['এই বছরের দান', stats.yearlyDonation, '', DollarSign, true],
    ['সম্পন্ন কার্যক্রম', stats.completedActivities, '+', CheckCircle2],
    ['বছরের অভিজ্ঞতা', stats.yearsActive, '+', CalendarDays],
  ]

  return (
    <section className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 py-12 text-white">
      <motion.div
        className="mx-auto grid max-w-7xl divide-y divide-indigo-400/30 px-4 sm:px-6 md:grid-cols-4 md:divide-x md:divide-y-0"
        initial="hidden"
        variants={stagger}
        viewport={{ once: true, amount: 0.35 }}
        whileInView="show"
      >
        {rows.map(([label, value, suffix, Icon, isMoney]) => (
          <motion.div className="px-5 py-6 text-center" key={label} variants={fadeUp}>
            <Icon aria-hidden="true" className="mx-auto h-6 w-6 text-indigo-100" />
            <p className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              {isMoney ? '৳' : ''}
              <AnimatedCounter value={value} />
              {suffix}
            </p>
            <p className="mt-2 text-sm font-semibold text-indigo-200">{label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

function AboutSection({ aboutText, orgName, tagline }) {
  const paragraphs = [
    aboutText,
    'আমরা সদস্যদের কল্যাণ, এলাকার উন্নয়ন, শিক্ষা সহায়তা, জরুরি সহযোগিতা এবং সামাজিক উদ্যোগকে একটি স্বচ্ছ ব্যবস্থার মধ্যে পরিচালনা করি।',
    'প্রতিটি সিদ্ধান্ত, অর্থনৈতিক রেকর্ড এবং কার্যক্রম সদস্য ও এলাকার মানুষের আস্থাকে কেন্দ্র করে গড়ে তোলা হয়েছে।',
  ]

  return (
    <section className="relative bg-white px-4 py-24 sm:px-6" id="about">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.85fr]">
        <motion.div initial="hidden" variants={stagger} viewport={{ once: true }} whileInView="show">
          <motion.p className="border-l-4 border-indigo-600 pl-3 text-sm font-bold uppercase tracking-[0.18em] text-indigo-700" variants={fadeUp}>
            আমাদের সম্পর্কে
          </motion.p>
          <motion.h2 className="mt-4 text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl" variants={fadeUp}>
            আমরা কারা এবং কী করি?
          </motion.h2>
          <div className="mt-6 grid gap-4 text-base leading-8 text-gray-600">
            {paragraphs.map((paragraph) => (
              <motion.p key={paragraph} variants={fadeUp}>
                {paragraph}
              </motion.p>
            ))}
          </div>
          <motion.div className="mt-8 grid gap-4 sm:grid-cols-3" variants={stagger}>
            {[
              ['সদস্যদের কল্যাণে কাজ', Users],
              ['এলাকার উন্নয়নে অবদান', Sparkles],
              ['সামাজিক কার্যক্রম পরিচালনা', HeartHandshake],
            ].map(([text, Icon]) => (
              <motion.div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm" key={text} variants={fadeUp}>
                <Icon aria-hidden="true" className="h-5 w-5 text-indigo-600" />
                <p className="mt-3 text-sm font-semibold text-gray-900">✦ {text}</p>
              </motion.div>
            ))}
          </motion.div>
          <motion.a className="mt-8 inline-flex items-center gap-2 text-base font-bold text-indigo-700 hover:text-indigo-800" href="#membership" variants={fadeUp}>
            আমাদের সম্পর্কে আরও পড়ুন <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </motion.a>
        </motion.div>

        <motion.div
          className="relative min-h-[420px]"
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.55 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, scale: 1 }}
        >
          <div className="absolute inset-8 rounded-[3rem] bg-indigo-100 blur-3xl" />
          <div className="absolute left-0 top-8 w-[82%] rotate-3 rounded-3xl border border-indigo-100 bg-white p-8 shadow-2xl shadow-indigo-950/10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
              <Sparkles aria-hidden="true" className="h-6 w-6" />
            </div>
            <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">Founded</p>
            <h3 className="mt-2 text-5xl font-bold tracking-tight text-gray-950">২০১৯</h3>
            <p className="mt-4 text-lg font-semibold text-gray-800">{orgName}</p>
            <p className="mt-2 text-gray-500">{tagline}</p>
          </div>
          <div className="absolute bottom-4 right-0 w-[80%] -rotate-2 rounded-3xl border border-emerald-100 bg-emerald-50 p-8 shadow-xl shadow-emerald-950/10">
            <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-emerald-600" />
            <h3 className="mt-5 text-2xl font-semibold tracking-tight text-emerald-950">
              স্বচ্ছ হিসাব, সক্রিয় সদস্য, দ্রুত উদ্যোগ
            </h3>
            <p className="mt-3 text-sm leading-7 text-emerald-800">
              সব নোটিশ, দান, ফি এবং কার্যক্রম একসাথে দেখা ও পরিচালনা করা যায়।
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function EventsSection({ events, loading, onRsvp }) {
  return (
    <section className="bg-white px-4 py-24 sm:px-6" id="events">
      <SectionHeading
        eyebrow="ইভেন্ট"
        title="আসন্ন মিটিং ও ভ্রমণ"
        text="সদস্যদের জন্য পরিকল্পিত মিটিং, ভ্রমণ এবং সামাজিক আয়োজন।"
      />
      {loading ? (
        <div className="mx-auto mt-10 max-w-7xl">
          <Skeleton rows={3} />
        </div>
      ) : events.length ? (
        <motion.div
          className="mx-auto mt-10 flex max-w-7xl snap-x gap-6 overflow-x-auto pb-3 md:grid md:grid-cols-3 md:overflow-visible"
          initial="hidden"
          variants={stagger}
          viewport={{ once: true, amount: 0.2 }}
          whileInView="show"
        >
          {events.map((event) => (
            <EventCard event={event} key={`${event.eventType}-${event._id}`} onRsvp={onRsvp} />
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="mx-auto mt-10 max-w-2xl rounded-3xl border border-dashed border-indigo-200 bg-indigo-50 p-10 text-center"
          initial={{ opacity: 0, y: 18 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <CalendarDays aria-hidden="true" className="mx-auto h-14 w-14 text-indigo-600" />
          <h3 className="mt-5 text-2xl font-semibold tracking-tight text-gray-950">
            শীঘ্রই নতুন অনুষ্ঠান আসছে
          </h3>
        </motion.div>
      )}
    </section>
  )
}

function EventCard({ event, onRsvp }) {
  const isTour = event.eventType === 'tour'
  const remainingSeats = isTour && event.seatCapacity ? Math.max(event.seatCapacity - (event.participants?.length || 0), 0) : null

  return (
    <motion.article
      className="relative min-w-[290px] snap-start overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl md:min-w-0"
      variants={fadeUp}
    >
      <div className={`h-20 ${isTour ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
        <span className="ml-5 mt-5 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
          {isTour ? 'ভ্রমণ' : 'মিটিং'}
        </span>
      </div>
      <div className="absolute right-5 top-10 rounded-2xl bg-white px-4 py-3 text-center shadow-lg">
        <p className="text-2xl font-bold leading-none text-indigo-700">
          {new Date(event.date).toLocaleDateString('bn-BD', { day: 'numeric' })}
        </p>
        <p className="mt-1 text-xs font-bold uppercase text-gray-500">{getMonthName(event.date)}</p>
      </div>
      <div className="p-6">
        <h3 className="line-clamp-2 text-xl font-semibold tracking-tight text-gray-950">{event.title}</h3>
        <div className="mt-4 grid gap-2 text-sm text-gray-500">
          <span className="inline-flex items-center gap-2">
            <MapPin aria-hidden="true" className="h-4 w-4 text-indigo-600" />
            {event.location || 'Dargah Para'}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock3 aria-hidden="true" className="h-4 w-4 text-indigo-600" />
            {formatTime(event.date)}
          </span>
        </div>
        {remainingSeats !== null ? (
          <p className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            মাত্র {remainingSeats.toLocaleString('bn-BD')}টি আসন বাকি
          </p>
        ) : null}
        <Button className="mt-6 w-full bg-indigo-600" onClick={onRsvp}>
          অংশগ্রহণ করুন
        </Button>
      </div>
    </motion.article>
  )
}

function DonationSection({
  disabled,
  errors,
  form,
  message,
  onAmount,
  onSubmit,
  registerDonation,
  settings,
  submitting,
  successMessage,
}) {
  return (
    <section className="relative bg-indigo-50 px-4 py-24 sm:px-6" id="donate">
      <Wave className="absolute left-0 top-0 rotate-180 text-white" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1fr]">
        <motion.div initial="hidden" variants={stagger} viewport={{ once: true }} whileInView="show">
          <motion.p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-700" variants={fadeUp}>
            দান
          </motion.p>
          <motion.h2 className="mt-4 text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl" variants={fadeUp}>
            আপনার দানে বদলে যাবে একটি জীবন
          </motion.h2>
          <motion.p className="mt-5 max-w-xl text-base leading-8 text-gray-600" variants={fadeUp}>
            শিক্ষা সহায়তা, জরুরি ত্রাণ, সামাজিক কার্যক্রম এবং এলাকার উন্নয়নে আপনার অনুদান সরাসরি কাজে লাগে।
          </motion.p>
          <motion.div className="mt-8 grid gap-3" variants={stagger}>
            {[
              ['৳১০০০', 'একজন শিক্ষার্থীর সহায়তা'],
              ['৳৫০০০', 'একটি পরিবারের ত্রাণ'],
              ['৳১০০০০', 'একটি কার্যক্রমের আয়োজন'],
            ].map(([amount, text]) => (
              <motion.div className="flex items-center gap-4 rounded-2xl bg-white/80 p-4 shadow-sm" key={amount} variants={fadeUp}>
                <span className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white">{amount}</span>
                <span className="font-semibold text-gray-800">{text}</span>
              </motion.div>
            ))}
          </motion.div>
          <motion.div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-gray-700" variants={fadeUp}>
            <span className="rounded-full bg-white px-4 py-2">🔒 নিরাপদ লেনদেন</span>
            <span className="rounded-full bg-white px-4 py-2">✓ যাচাইকৃত সংগঠন</span>
          </motion.div>
        </motion.div>

        <motion.div
          className="rounded-[2rem] border border-indigo-100 bg-white p-6 shadow-2xl shadow-indigo-950/10 sm:p-8"
          initial={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.55 }}
          viewport={{ once: true, amount: 0.25 }}
          whileInView={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-gray-950">দান করুন</h3>
              <p className="mt-1 text-sm text-gray-500">
                {settings.donationProvider || 'Donation'} নম্বর:{' '}
                <span className="font-bold text-gray-900">{settings.donationNumber || 'Admin সেট করবেন'}</span>
              </p>
            </div>
            <HeartHandshake aria-hidden="true" className="h-8 w-8 text-indigo-600" />
          </div>
          {disabled ? (
            <p className="mt-6 rounded-2xl bg-yellow-50 p-4 text-sm font-semibold text-yellow-800">
              আপাতত পাবলিক দান বন্ধ আছে।
            </p>
          ) : (
            <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
              <div>
                <p className="text-sm font-semibold text-gray-700">পরিমাণ নির্বাচন করুন</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {quickAmounts.map((amount) => (
                    <button
                      className={`min-h-12 rounded-xl border px-4 text-sm font-bold transition ${
                        Number(form.amount) === amount
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'
                      }`}
                      key={amount}
                      onClick={() => onAmount(amount)}
                      type="button"
                    >
                      {money(amount)}
                    </button>
                  ))}
                </div>
              </div>
              <Field
                error={errors.amount?.message}
                label="Custom amount"
                min="1"
                type="number"
                {...registerDonation('amount')}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Field error={errors.donorName?.message} label="নাম" {...registerDonation('donorName')} />
                <Field
                  error={errors.phone?.message}
                  label="ফোন"
                  pattern="01[3-9][0-9]{8}"
                  {...registerDonation('phone')}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  error={errors.method?.message}
                  label="পেমেন্ট মাধ্যম"
                  placeholder="bKash / Nagad"
                  {...registerDonation('method')}
                />
                <Field
                  error={errors.transactionId?.message}
                  label="ট্রানজ্যাকশন আইডি"
                  {...registerDonation('transactionId')}
                />
              </div>
              <Field error={errors.note?.message} label="বার্তা" rows={3} textarea {...registerDonation('note')} />
              {message ? <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p> : null}
              {successMessage ? (
                <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                  {successMessage}
                </p>
              ) : null}
              <Button className="min-h-14 w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-base" icon={Send} loading={submitting} type="submit">
                দান করুন
              </Button>
              <p className="text-center text-xs leading-6 text-gray-500">
                আপনার দান সম্পূর্ণ স্বেচ্ছামূলক এবং যেকোনো পরিমাণ গ্রহণযোগ্য।
              </p>
            </form>
          )}
        </motion.div>
      </div>
      <Wave className="absolute bottom-0 left-0 text-white" />
    </section>
  )
}

function BlogSection({ blogs, loading }) {
  const approvedBlogs = blogs.filter((blog) => (blog.moderationStatus || 'approved') === 'approved')

  return (
    <section className="bg-gray-50 px-4 py-24 sm:px-6" id="blog">
      <SectionHeading
        eyebrow="ব্লগ"
        title="সদস্যদের লেখা"
        text="এলাকার গল্প, অভিজ্ঞতা এবং সদস্যদের ভাবনা।"
      />
      {loading ? (
        <div className="mx-auto mt-10 max-w-7xl">
          <Skeleton rows={3} />
        </div>
      ) : (
        <motion.div
          className="mx-auto mt-10 grid max-w-7xl gap-6 md:grid-cols-3"
          initial="hidden"
          variants={stagger}
          viewport={{ once: true, amount: 0.2 }}
          whileInView="show"
        >
          {approvedBlogs.slice(0, 3).map((blog) => (
            <motion.article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl" key={blog._id} variants={fadeUp}>
              {blog.imageUrl ? (
                <img alt={blog.title} className="h-52 w-full object-cover" src={blog.imageUrl} />
              ) : (
                <div className="flex h-52 items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-700 text-white">
                  <BookOpen aria-hidden="true" className="h-12 w-12" />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                    {blog.createdBy?.name?.slice(0, 1) || 'স'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{blog.createdBy?.name || 'সদস্য'}</p>
                    <p className="text-xs text-gray-500">{formatDate(blog.createdAt)}</p>
                  </div>
                </div>
                <h3 className="mt-5 line-clamp-2 text-xl font-semibold tracking-tight text-gray-950">{blog.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-gray-500">{plainText(blog.body)}</p>
                <div className="mt-5 flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>{estimateReadTime(blog.body)} মিনিট পড়া</span>
                  <span className="inline-flex items-center gap-1">
                    <Heart aria-hidden="true" className="h-4 w-4 text-red-500" />
                    {blog.likes?.length || 0}
                  </span>
                </div>
                <Link className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-700" to="/login">
                  পড়ুন <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}
      <div className="mt-10 text-center">
        <Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 text-sm font-semibold text-gray-800 transition hover:border-indigo-300 hover:text-indigo-700" to="/login">
          সকল ব্লগ দেখুন <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

function MembershipCta() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 to-violet-950 px-4 py-24 text-white sm:px-6" id="membership">
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(135deg,rgba(0,173,181,0.25)_25%,transparent_25%,transparent_50%,rgba(0,173,181,0.25)_50%,rgba(0,173,181,0.25)_75%,transparent_75%,transparent)] bg-[length:42px_42px] opacity-40" />
      <motion.div
        className="relative mx-auto max-w-4xl text-center"
        initial="hidden"
        variants={stagger}
        viewport={{ once: true }}
        whileInView="show"
      >
        <motion.h2 className="text-4xl font-semibold tracking-tight sm:text-5xl" variants={fadeUp}>
          আজই আমাদের পরিবারের অংশ হোন
        </motion.h2>
        <motion.p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-indigo-200" variants={fadeUp}>
          সদস্যপদে পাবেন সংগঠনের আপডেট, সিদ্ধান্তে অংশগ্রহণ, স্বচ্ছ অর্থনৈতিক তথ্য এবং এলাকার উন্নয়নে সরাসরি ভূমিকা রাখার সুযোগ।
        </motion.p>
        <motion.div className="mt-7 flex flex-wrap justify-center gap-3 text-sm font-semibold text-indigo-100" variants={fadeUp}>
          <span>✓ ব্যক্তিগত পেমেন্ট হিস্ট্রি</span>
          <span>✓ মিটিং ও ভ্রমণ RSVP</span>
          <span>✓ নোটিশ ও কার্যক্রম অ্যাক্সেস</span>
        </motion.div>
        <motion.div className="mt-9 flex flex-wrap justify-center gap-4" variants={fadeUp}>
          <Link className="inline-flex min-h-14 items-center rounded-xl bg-white px-8 text-base font-bold text-indigo-700 transition hover:bg-indigo-50" to="/register">
            এখনই নিবন্ধন করুন
          </Link>
          <a className="inline-flex min-h-14 items-center rounded-xl border border-white/40 px-8 text-base font-bold text-white transition hover:bg-white/10" href="#about">
            আরও জানুন
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}

function HomepageFooter({ notices, orgName, settings, tagline }) {
  const quickLinks = [
    ['হোম', '#home'],
    ['সম্পর্কে', '#about'],
    ['সদস্যপদ', '#membership'],
    ['দান', '#donate'],
    ['যোগাযোগ', '#contact'],
  ]

  return (
    <footer className="relative bg-gray-950 px-4 pt-20 text-white sm:px-6" id="contact">
      <Wave className="absolute left-0 top-0 rotate-180 text-violet-950" />
      <div className="mx-auto grid max-w-7xl gap-10 pb-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500">
              <Sparkles aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="font-semibold tracking-tight">{orgName}</span>
          </div>
          <p className="mt-4 text-sm leading-7 text-gray-400">{tagline}</p>
          <div className="mt-5 flex gap-3">
            <SocialLink href={settings.facebookUrl} icon={Globe2} label="Facebook" />
            <SocialLink href={settings.youtubeUrl} icon={PlayCircle} label="YouTube" />
            <SocialLink href={settings.whatsappGroupUrl} icon={MessageCircle} label="WhatsApp" />
          </div>
        </div>
        <div>
          <h3 className="font-semibold">দ্রুত লিংক</h3>
          <div className="mt-4 grid gap-3 text-sm text-gray-400">
            {quickLinks.map(([label, href]) => (
              <a className="transition hover:text-white" href={href} key={href}>
                {label}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold">যোগাযোগ</h3>
          <div className="mt-4 grid gap-3 text-sm leading-7 text-gray-400">
            <p>{settings.address || 'Dargah Para, Bangladesh'}</p>
            <p>{settings.contactNumber || 'সংগঠন অফিস'}</p>
            <p>dargahpara@example.com</p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold">সাম্প্রতিক নোটিশ</h3>
          <div className="mt-4 grid gap-4">
            {notices.slice(0, 3).map((notice) => (
              <a className="block text-sm text-gray-400 transition hover:text-white" href="/login" key={notice._id}>
                <span className="line-clamp-2 font-semibold">{notice.title}</span>
                <span className="mt-1 block text-xs text-gray-500">{formatDate(notice.createdAt)}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-white/10 py-5 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} {orgName}. সর্বস্বত্ব সংরক্ষিত।</p>
        <div className="flex gap-4">
          <a className="hover:text-white" href="#home">গোপনীয়তা নীতি</a>
          <a className="hover:text-white" href="#home">ব্যবহারের শর্তাবলী</a>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({ href, icon: Icon, label }) {
  return (
    <a
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-200 transition hover:bg-indigo-600 hover:text-white"
      href={href || '#home'}
      rel="noreferrer"
      target={href ? '_blank' : undefined}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </a>
  )
}

function SectionHeading({ eyebrow, text, title }) {
  return (
    <motion.div
      className="mx-auto max-w-3xl text-center"
      initial="hidden"
      variants={stagger}
      viewport={{ once: true, amount: 0.35 }}
      whileInView="show"
    >
      <motion.p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-700" variants={fadeUp}>
        {eyebrow}
      </motion.p>
      <motion.h2 className="mt-4 text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl" variants={fadeUp}>
        {title}
      </motion.h2>
      <motion.p className="mt-4 text-base leading-8 text-gray-500" variants={fadeUp}>
        {text}
      </motion.p>
    </motion.div>
  )
}

function AnimatedCounter({ value }) {
  const ref = useRef(null)
  const [started, setStarted] = useState(false)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) {
      return undefined
    }

    const duration = 1200
    const startedAt = performance.now()
    let frame = 0

    const tick = (time) => {
      const progress = Math.min((time - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(Number(value || 0) * eased))

      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
  }, [started, value])

  return (
    <span className="tabular-nums" ref={ref}>
      {display.toLocaleString('bn-BD')}
    </span>
  )
}

function Wave({ className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-10 w-full ${className}`}
      preserveAspectRatio="none"
      viewBox="0 0 1440 80"
    >
      <path
        d="M0 32L80 37.3C160 43 320 53 480 48C640 43 800 21 960 16C1120 11 1280 21 1360 26.7L1440 32V80H0V32Z"
        fill="currentColor"
      />
    </svg>
  )
}
