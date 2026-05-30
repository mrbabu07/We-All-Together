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
  Upload,
  Users,
  X,
} from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import api, { getErrorMessage } from '../api/http'
import communityHero from '../assets/community-hero.png'
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
import { readFileAsDataUrl } from '../utils/fileUtils'
import { isStaffUser } from '../utils/permissionUtils'

const initialDonationForm = {
  amount: '1000',
  donorName: '',
  method: 'bKash',
  note: '',
  phone: '',
  proofImageUrl: '',
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
  proofImageUrl: z.string().trim().min(1, 'Payment screenshot is required.'),
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
  const [uploadingDonationProof, setUploadingDonationProof] = useState(false)
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

  const uploadDonationProof = async (file) => {
    if (!file) {
      return
    }

    try {
      setMessage('')
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
      setMessage(getErrorMessage(error))
    } finally {
      setUploadingDonationProof(false)
    }
  }

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
          className="home-card max-w-xl p-8 text-center"
          initial={{ opacity: 0, y: 16 }}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-50)] text-[var(--brand-600)]">
            <ShieldCheck aria-hidden="true" className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold text-gray-900">
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
      className="home-shell overflow-hidden text-gray-900"
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
        onProofUpload={uploadDonationProof}
        onSubmit={handleDonationSubmit(submitDonation)}
        registerDonation={registerDonation}
        settings={data.settings}
        submitting={submittingDonation}
        successMessage={successMessage}
        uploadingProof={uploadingDonationProof}
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
            className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-700)] text-white shadow-[var(--shadow-brand)] transition hover:bg-[var(--brand-900)]"
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
  const dashboardPath = isStaffUser(user) ? '/admin' : '/member'
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
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <nav
        className={`mx-auto flex h-16 max-w-7xl items-center justify-between rounded-[var(--radius-md)] px-4 transition-all duration-300 sm:px-5 ${
          scrolled ? 'glass-surface' : 'border border-white/20 bg-white/10 text-white backdrop-blur-md'
        }`}
      >
        <a className="flex items-center gap-3" href="#home">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-600)] to-[var(--brand-800)] text-white shadow-[var(--shadow-brand)]">
            <Sparkles aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className={`max-w-48 truncate text-base font-semibold sm:max-w-none ${scrolled ? 'text-gray-950' : 'text-white'}`}>
            {orgName}
          </span>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map(([label, href]) => (
            <a
              className={`group relative text-sm font-semibold transition ${
                scrolled ? 'text-gray-600 hover:text-[var(--brand-700)]' : 'text-white/80 hover:text-white'
              }`}
              href={href}
              key={href}
            >
              {label}
              <span className="absolute -bottom-2 left-0 h-0.5 w-0 rounded-full bg-[var(--brand-600)] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {showDarkToggle ? <ThemeToggle /> : null}
          {showFontControls ? <FontSizeControl /> : null}
          <Link
            className={`inline-flex min-h-11 items-center rounded-[var(--radius-md)] border px-5 text-sm font-semibold transition ${
              scrolled
                ? 'border-gray-300 text-gray-800 hover:bg-white'
                : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
            }`}
            to="/login"
          >
            লগইন
          </Link>
          <Link className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] bg-[var(--brand-600)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition hover:bg-[var(--brand-700)]" to={user ? dashboardPath : '/register'}>
            {user ? 'ড্যাশবোর্ড' : 'নিবন্ধন করুন'}
          </Link>
        </div>

        <button
          className={`inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border lg:hidden ${
            scrolled
              ? 'border-gray-200 bg-white/70 text-gray-800'
              : 'border-white/30 bg-white/10 text-white'
          }`}
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
              className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-gray-100 text-gray-700"
                onClick={() => setMenuOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-10 grid gap-3">
              {links.map(([label, href]) => (
                <a
                  className="rounded-[var(--radius-md)] px-4 py-4 text-lg font-semibold text-gray-800 transition hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]"
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
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] border border-gray-300 text-sm font-semibold text-gray-800"
                onClick={() => setMenuOpen(false)}
                to="/login"
              >
                লগইন
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-600)] text-sm font-semibold text-white"
                onClick={() => setMenuOpen(false)}
                to={user ? dashboardPath : '/register'}
              >
                {user ? 'ড্যাশবোর্ড' : 'নিবন্ধন করুন'}
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}

function HeroSection({ orgName, phrases, stats, tagline }) {
  const typedHeading = useTypewriter(phrases)

  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-[#222831] text-white" id="home">
      <div
        aria-hidden="true"
        className="hero-image-bg absolute inset-0 opacity-70"
        style={{ backgroundImage: `url(${communityHero})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(34,40,49,0.96)_0%,rgba(34,40,49,0.78)_46%,rgba(34,40,49,0.32)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(34,40,49,0.92))]" />
      <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-4 pb-16 pt-28 sm:px-6">
        <motion.div
          animate="show"
          className="max-w-3xl"
          initial="hidden"
          variants={stagger}
        >
          <motion.span
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md"
            variants={fadeUp}
          >
            <Sparkles aria-hidden="true" className="h-4 w-4 text-[var(--brand-300)]" />
            দরগাহ পাড়া এলাকার ঐক্যের প্ল্যাটফর্ম
          </motion.span>
          <motion.h1
            className="mt-7 max-w-4xl text-4xl font-bold leading-tight text-white sm:text-6xl lg:text-[66px]"
            variants={fadeUp}
          >
            <span>{typedHeading}</span>
            <span className="typewriter-cursor text-[var(--brand-300)]">|</span>
          </motion.h1>
          <motion.p className="mt-6 max-w-2xl text-lg leading-9 text-white/80" variants={fadeUp}>
            {orgName} - {tagline}. সদস্যপদ, নোটিশ, অর্থ ব্যবস্থাপনা ও সামাজিক কার্যক্রমকে এক জায়গায় সহজভাবে পরিচালনার আধুনিক কমিউনিটি প্ল্যাটফর্ম।
          </motion.p>
          <motion.div className="mt-8 flex flex-wrap gap-4" variants={fadeUp}>
            <Link className="inline-flex min-h-14 items-center gap-3 rounded-[var(--radius-md)] bg-[var(--brand-600)] px-8 py-4 text-base font-semibold text-white shadow-[var(--shadow-brand)] transition hover:-translate-y-0.5 hover:bg-[var(--brand-700)]" to="/register">
              সদস্য হোন
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
            <a className="inline-flex min-h-14 items-center gap-3 rounded-[var(--radius-md)] border border-white/25 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/20" href="#about">
              <PlayCircle aria-hidden="true" className="h-5 w-5" />
              আরও জানুন
            </a>
          </motion.div>
          <motion.div
            className="mt-8 grid gap-3 text-sm font-semibold text-white/80 sm:flex sm:flex-wrap sm:items-center sm:gap-5"
            variants={fadeUp}
          >
            <TrustItem icon={Users} text={`${stats.totalMembers}+ সক্রিয় সদস্য`} />
            <TrustItem icon={CalendarDays} text={`${stats.yearsActive}+ বছরের অভিজ্ঞতা`} />
            <TrustItem icon={Heart} text="সমাজসেবায় প্রতিশ্রুতিবদ্ধ" />
          </motion.div>
        </motion.div>

        <motion.div
          animate="show"
          className="mt-12 grid gap-3 sm:grid-cols-3 lg:max-w-3xl"
          initial="hidden"
          variants={stagger}
        >
          {[
            ['সদস্য', stats.totalMembers, '+', Users],
            ['দান', stats.yearlyDonation, '৳', HeartHandshake],
            ['কার্যক্রম', stats.completedActivities, '+', CheckCircle2],
          ].map(([label, value, suffix, Icon]) => (
            <motion.div className="glass-surface-dark rounded-[var(--radius-md)] p-4" key={label} variants={fadeUp}>
              <Icon aria-hidden="true" className="h-5 w-5 text-[var(--brand-300)]" />
              <p className="mt-3 text-2xl font-bold text-white">
                {suffix === '৳' ? suffix : ''}
                <AnimatedCounter value={value} />
                {suffix !== '৳' ? suffix : ''}
              </p>
              <p className="text-sm font-semibold text-white/70">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function TrustItem({ icon: Icon, text }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon aria-hidden="true" className="h-4 w-4 text-[var(--brand-300)]" />
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
    <section className="bg-[#222831] px-4 py-8 text-white sm:px-6">
      <motion.div
        className="mx-auto grid max-w-7xl gap-3 md:grid-cols-4"
        initial="hidden"
        variants={stagger}
        viewport={{ once: true, amount: 0.35 }}
        whileInView="show"
      >
        {rows.map(([label, value, suffix, Icon, isMoney]) => (
          <motion.div className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.06] px-5 py-5 text-center shadow-[0_18px_40px_rgba(0,0,0,0.16)] backdrop-blur" key={label} variants={fadeUp}>
            <Icon aria-hidden="true" className="mx-auto h-6 w-6 text-[var(--brand-300)]" />
            <p className="mt-3 text-4xl font-bold sm:text-5xl">
              {isMoney ? '৳' : ''}
              <AnimatedCounter value={value} />
              {suffix}
            </p>
            <p className="mt-2 text-sm font-semibold text-white/70">{label}</p>
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
    <section className="home-band" id="about">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.92fr]">
        <motion.div initial="hidden" variants={stagger} viewport={{ once: true }} whileInView="show">
          <motion.p className="home-kicker border-l-4 border-[var(--brand-600)] pl-3" variants={fadeUp}>
            আমাদের সম্পর্কে
          </motion.p>
          <motion.h2 className="home-title mt-4 text-4xl sm:text-5xl" variants={fadeUp}>
            আমরা কারা এবং কী করি?
          </motion.h2>
          <div className="home-copy mt-6 grid gap-4 text-base">
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
              <motion.div className="home-card p-4" key={text} variants={fadeUp}>
                <Icon aria-hidden="true" className="h-5 w-5 text-[var(--brand-600)]" />
                <p className="mt-3 text-sm font-semibold text-gray-900">{text}</p>
              </motion.div>
            ))}
          </motion.div>
          <motion.a className="mt-8 inline-flex items-center gap-2 text-base font-bold text-[var(--brand-700)] hover:text-[var(--brand-900)]" href="#membership" variants={fadeUp}>
            আমাদের সম্পর্কে আরও পড়ুন <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </motion.a>
        </motion.div>

        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.55 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, scale: 1 }}
        >
          <div className="home-card overflow-hidden p-0">
            <img alt={orgName} className="h-80 w-full object-cover sm:h-96" src={communityHero} />
            <div className="grid gap-4 border-t border-gray-200 p-6 sm:grid-cols-[140px_1fr]">
              <div className="rounded-[var(--radius-md)] bg-[var(--brand-50)] p-4">
                <p className="text-sm font-bold uppercase text-[var(--brand-700)]">Founded</p>
                <p className="mt-2 text-4xl font-bold text-gray-950">২০১৯</p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-950">{orgName}</h3>
                <p className="mt-2 text-sm leading-7 text-gray-600">{tagline}</p>
                <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                  স্বচ্ছ হিসাব ও সক্রিয় সদস্য ব্যবস্থাপনা
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function EventsSection({ events, loading, onRsvp }) {
  return (
    <section className="home-band-muted" id="events">
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
          className="mx-auto mt-10 max-w-2xl rounded-[var(--radius-md)] border border-dashed border-[var(--brand-200)] bg-[var(--brand-50)] p-10 text-center"
          initial={{ opacity: 0, y: 18 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <CalendarDays aria-hidden="true" className="mx-auto h-14 w-14 text-[var(--brand-600)]" />
          <h3 className="mt-5 text-2xl font-semibold text-gray-950">
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
      className="home-card relative min-w-[290px] snap-start overflow-hidden md:min-w-0"
      variants={fadeUp}
    >
      <div className={`h-20 ${isTour ? 'bg-emerald-700' : 'bg-[var(--brand-700)]'}`}>
        <span className="ml-5 mt-5 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
          {isTour ? 'ভ্রমণ' : 'মিটিং'}
        </span>
      </div>
      <div className="absolute right-5 top-10 rounded-[var(--radius-md)] bg-white px-4 py-3 text-center shadow-lg">
        <p className="text-2xl font-bold leading-none text-[var(--brand-700)]">
          {new Date(event.date).toLocaleDateString('bn-BD', { day: 'numeric' })}
        </p>
        <p className="mt-1 text-xs font-bold uppercase text-gray-500">{getMonthName(event.date)}</p>
      </div>
      <div className="p-6">
        <h3 className="line-clamp-2 text-xl font-semibold text-gray-950">{event.title}</h3>
        <div className="mt-4 grid gap-2 text-sm text-gray-500">
          <span className="inline-flex items-center gap-2">
            <MapPin aria-hidden="true" className="h-4 w-4 text-[var(--brand-600)]" />
            {event.location || 'Dargah Para'}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock3 aria-hidden="true" className="h-4 w-4 text-[var(--brand-600)]" />
            {formatTime(event.date)}
          </span>
        </div>
        {remainingSeats !== null ? (
          <p className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            মাত্র {remainingSeats.toLocaleString('bn-BD')}টি আসন বাকি
          </p>
        ) : null}
        <Button className="mt-6 w-full" onClick={onRsvp}>
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
  onProofUpload,
  onSubmit,
  registerDonation,
  settings,
  submitting,
  successMessage,
  uploadingProof,
}) {
  return (
    <section className="relative overflow-hidden bg-[#222831] px-4 py-24 text-white sm:px-6" id="donate">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,122,128,0.24),transparent_42%,rgba(255,255,255,0.04))]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1fr]">
        <motion.div initial="hidden" variants={stagger} viewport={{ once: true }} whileInView="show">
          <motion.p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--brand-300)]" variants={fadeUp}>
            দান
          </motion.p>
          <motion.h2 className="mt-4 text-4xl font-semibold text-white sm:text-5xl" variants={fadeUp}>
            আপনার দানে বদলে যাবে একটি জীবন
          </motion.h2>
          <motion.p className="mt-5 max-w-xl text-base leading-8 text-white/70" variants={fadeUp}>
            শিক্ষা সহায়তা, জরুরি ত্রাণ, সামাজিক কার্যক্রম এবং এলাকার উন্নয়নে আপনার অনুদান সরাসরি কাজে লাগে।
          </motion.p>
          <motion.div className="mt-8 grid gap-3" variants={stagger}>
            {[
              ['৳১০০০', 'একজন শিক্ষার্থীর সহায়তা'],
              ['৳৫০০০', 'একটি পরিবারের ত্রাণ'],
              ['৳১০০০০', 'একটি কার্যক্রমের আয়োজন'],
            ].map(([amount, text]) => (
              <motion.div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-white/10 bg-white/[0.06] p-4 shadow-sm backdrop-blur" key={amount} variants={fadeUp}>
                <span className="rounded-[var(--radius-sm)] bg-[var(--brand-600)] px-4 py-2 font-bold text-white">{amount}</span>
                <span className="font-semibold text-white/80">{text}</span>
              </motion.div>
            ))}
          </motion.div>
          <motion.div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-white/80" variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2">
              <ShieldCheck aria-hidden="true" className="h-4 w-4 text-[var(--brand-300)]" />
              নিরাপদ লেনদেন
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-[var(--brand-300)]" />
              যাচাইকৃত সংগঠন
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          className="rounded-[var(--radius-md)] border border-white/10 bg-white p-6 text-gray-900 shadow-2xl shadow-black/20 sm:p-8"
          initial={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.55 }}
          viewport={{ once: true, amount: 0.25 }}
          whileInView={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-gray-950">দান করুন</h3>
              <p className="mt-1 text-sm text-gray-500">
                {settings.donationProvider || 'Donation'} নম্বর:{' '}
                <span className="font-bold text-gray-900">{settings.donationNumber || 'Admin সেট করবেন'}</span>
              </p>
            </div>
            <HeartHandshake aria-hidden="true" className="h-8 w-8 text-[var(--brand-600)]" />
          </div>
          {disabled ? (
            <p className="mt-6 rounded-[var(--radius-md)] bg-yellow-50 p-4 text-sm font-semibold text-yellow-800">
              আপাতত পাবলিক দান বন্ধ আছে।
            </p>
          ) : (
            <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
              <div>
                <p className="text-sm font-semibold text-gray-700">পরিমাণ নির্বাচন করুন</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {quickAmounts.map((amount) => (
                    <button
                      className={`min-h-12 rounded-[var(--radius-md)] border px-4 text-sm font-bold transition ${
                        Number(form.amount) === amount
                          ? 'border-[var(--brand-600)] bg-[var(--brand-50)] text-[var(--brand-700)]'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-[var(--brand-300)]'
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
              <input type="hidden" {...registerDonation('proofImageUrl')} />
              <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                <span>পেমেন্ট স্ক্রিনশট</span>
                <span className="flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-[var(--brand-300)]">
                  <Upload aria-hidden="true" className="h-4 w-4 text-[var(--brand-600)]" />
                  {uploadingProof ? 'আপলোড হচ্ছে...' : 'স্ক্রিনশট আপলোড করুন'}
                </span>
                <input
                  accept="image/*"
                  className="sr-only"
                  disabled={uploadingProof}
                  onChange={(event) => onProofUpload(event.target.files?.[0])}
                  type="file"
                />
              </label>
              {errors.proofImageUrl?.message ? (
                <p className="text-sm font-semibold text-red-600">
                  {errors.proofImageUrl.message}
                </p>
              ) : null}
              {form.proofImageUrl ? (
                <a
                  className="text-sm font-semibold text-[var(--brand-700)] hover:text-[var(--brand-900)]"
                  href={form.proofImageUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  স্ক্রিনশট আপলোড হয়েছে
                </a>
              ) : null}
              <Field error={errors.note?.message} label="বার্তা" rows={3} textarea {...registerDonation('note')} />
              {message ? <p className="rounded-[var(--radius-md)] bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p> : null}
              {successMessage ? (
                <p className="rounded-[var(--radius-md)] bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                  {successMessage}
                </p>
              ) : null}
              <Button
                className="min-h-14 w-full text-base"
                icon={Send}
                loading={submitting || uploadingProof}
                type="submit"
              >
                দান করুন
              </Button>
              <p className="text-center text-xs leading-6 text-gray-500">
                আপনার দান সম্পূর্ণ স্বেচ্ছামূলক এবং যেকোনো পরিমাণ গ্রহণযোগ্য।
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}

function BlogSection({ blogs, loading }) {
  const approvedBlogs = blogs.filter((blog) => (blog.moderationStatus || 'approved') === 'approved')

  return (
    <section className="home-band-muted" id="blog">
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
            <motion.article className="home-card overflow-hidden p-0" key={blog._id} variants={fadeUp}>
              {blog.imageUrl ? (
                <img alt={blog.title} className="h-52 w-full object-cover" src={blog.imageUrl} />
              ) : (
                <div className="flex h-52 items-center justify-center bg-gradient-to-br from-[var(--brand-600)] to-[var(--brand-900)] text-white">
                  <BookOpen aria-hidden="true" className="h-12 w-12" />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-50)] font-bold text-[var(--brand-700)]">
                    {blog.createdBy?.name?.slice(0, 1) || 'স'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{blog.createdBy?.name || 'সদস্য'}</p>
                    <p className="text-xs text-gray-500">{formatDate(blog.createdAt)}</p>
                  </div>
                </div>
                <h3 className="mt-5 line-clamp-2 text-xl font-semibold text-gray-950">{blog.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-gray-500">{plainText(blog.body)}</p>
                <div className="mt-5 flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>{estimateReadTime(blog.body)} মিনিট পড়া</span>
                  <span className="inline-flex items-center gap-1">
                    <Heart aria-hidden="true" className="h-4 w-4 text-red-500" />
                    {blog.likes?.length || 0}
                  </span>
                </div>
                <Link className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--brand-700)]" to="/login">
                  পড়ুন <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}
      <div className="mt-10 text-center">
        <Link className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] border border-gray-300 bg-white px-6 text-sm font-semibold text-gray-800 transition hover:border-[var(--brand-300)] hover:text-[var(--brand-700)]" to="/login">
          সকল ব্লগ দেখুন <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

function MembershipCta() {
  return (
    <section className="relative overflow-hidden bg-[#222831] px-4 py-24 text-white sm:px-6" id="membership">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,122,128,0.28),transparent_52%)]" />
      <motion.div
        className="relative mx-auto max-w-4xl text-center"
        initial="hidden"
        variants={stagger}
        viewport={{ once: true }}
        whileInView="show"
      >
        <motion.h2 className="text-4xl font-semibold sm:text-5xl" variants={fadeUp}>
          আজই আমাদের পরিবারের অংশ হোন
        </motion.h2>
        <motion.p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/70" variants={fadeUp}>
          সদস্যপদে পাবেন সংগঠনের আপডেট, সিদ্ধান্তে অংশগ্রহণ, স্বচ্ছ অর্থনৈতিক তথ্য এবং এলাকার উন্নয়নে সরাসরি ভূমিকা রাখার সুযোগ।
        </motion.p>
        <motion.div className="mt-7 flex flex-wrap justify-center gap-3 text-sm font-semibold text-white/75" variants={fadeUp}>
          <span>✓ ব্যক্তিগত পেমেন্ট হিস্ট্রি</span>
          <span>✓ মিটিং ও ভ্রমণ RSVP</span>
          <span>✓ নোটিশ ও কার্যক্রম অ্যাক্সেস</span>
        </motion.div>
        <motion.div className="mt-9 flex flex-wrap justify-center gap-4" variants={fadeUp}>
          <Link className="inline-flex min-h-14 items-center rounded-[var(--radius-md)] bg-white px-8 text-base font-bold text-[var(--brand-700)] transition hover:bg-[var(--brand-50)]" to="/register">
            এখনই নিবন্ধন করুন
          </Link>
          <a className="inline-flex min-h-14 items-center rounded-[var(--radius-md)] border border-white/40 px-8 text-base font-bold text-white transition hover:bg-white/10" href="#about">
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
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="mx-auto grid max-w-7xl gap-10 pb-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-800)]">
              <Sparkles aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="font-semibold">{orgName}</span>
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-200 transition hover:bg-[var(--brand-600)] hover:text-white"
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
      <motion.p className="home-kicker" variants={fadeUp}>
        {eyebrow}
      </motion.p>
      <motion.h2 className="home-title mt-4 text-4xl sm:text-5xl" variants={fadeUp}>
        {title}
      </motion.h2>
      <motion.p className="home-copy mt-4 text-base" variants={fadeUp}>
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
