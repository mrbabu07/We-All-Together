import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  HeartHandshake,
  Image as ImageIcon,
  Landmark,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  PlayCircle,
  Quote,
  Send,
  Share2,
  ShieldCheck,
  Star,
  Upload,
  Users,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import 'yet-another-react-lightbox/styles.css'
import { DEVELOPER_CREDIT_TEXT, ORG_NAME_BN } from '../../constants/brand'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, transition: { duration: 0.52, ease: 'easeOut' }, y: 0 },
}

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const quickAmounts = [500, 1000, 2000, 5000]

const getList = (value) => (Array.isArray(value) ? value : [])

const plainText = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const money = (value = 0) => `৳${Number(value || 0).toLocaleString('bn-BD')}`

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('bn-BD', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(value))
    : ''

const formatTime = (value) =>
  value
    ? new Intl.DateTimeFormat('bn-BD', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(value))
    : ''

const getEventDate = (event) => event?.date || event?.meetingDate || event?.startDate

const getImageUrl = (item = {}) =>
  item.imageUrl ||
  item.photoUrl ||
  item.coverImageUrl ||
  item.coverPhoto ||
  item.url ||
  item.image ||
  item.photo ||
  ''

const getName = (item = {}) => item.name || item.memberName || item.donorName || item.title || 'সদস্য'

const initials = (name = 'স') =>
  String(name)
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)

const categoryMeta = (category = '') => {
  const normalized = String(category || 'সাধারণ').toLowerCase()

  if (normalized.includes('জরুরি') || normalized.includes('urgent')) {
    return {
      bg: 'var(--danger-bg)',
      color: 'var(--danger)',
      label: category || 'জরুরি',
    }
  }

  if (normalized.includes('অনুষ্ঠান') || normalized.includes('event')) {
    return {
      bg: 'var(--warning-bg)',
      color: 'var(--warning)',
      label: category || 'অনুষ্ঠান',
    }
  }

  if (normalized.includes('আর্থিক') || normalized.includes('finance')) {
    return {
      bg: 'var(--success-bg)',
      color: 'var(--success)',
      label: category || 'আর্থিক',
    }
  }

  return {
    bg: 'rgba(13,148,136,0.10)',
      color: 'var(--accent-ui)',
    label: category || 'সাধারণ',
  }
}

const extractIframeSrc = (value = '') => {
  const text = String(value || '').trim()
  const match = text.match(/src=["']([^"']+)["']/i)
  return match?.[1] || text
}

const toYoutubeEmbed = (value = '') => {
  const url = extractIframeSrc(value)

  if (!url) return ''
  if (url.includes('/embed/')) return url

  try {
    const parsed = new URL(url)
    const watchId = parsed.searchParams.get('v')

    if (watchId) return `https://www.youtube.com/embed/${watchId}`
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '')
      return id ? `https://www.youtube.com/embed/${id}` : ''
    }
  } catch {
    return ''
  }

  return ''
}

export default function PremiumHomeSections({
  aboutText,
  data,
  donation,
  homepageControls,
  loading,
  noticeId,
  onRsvp,
  orgName,
  siteSettings,
  stats,
  tagline,
  upcomingEvents,
}) {
  return (
    <>
      <StatsBar stats={stats} />
      <AboutSection aboutText={aboutText} orgName={orgName} tagline={tagline} />
      <MembershipSection stats={stats} />
      <CountdownSection enabled={homepageControls.countdownEnabled !== false} event={upcomingEvents[0]} />
      <NoticesSection initialNoticeId={noticeId} loading={loading} notices={data.notices} />
      <EventsSection events={upcomingEvents} loading={loading} onRsvp={onRsvp} />
      <DonationSection donation={donation} settings={siteSettings} />
      <GallerySection gallery={data.gallery} loading={loading} />
      <CommitteeSection enabled={homepageControls.committeeEnabled !== false} members={data.committee} />
      <TestimonialsSection enabled={homepageControls.testimonialsEnabled !== false} items={data.testimonials} />
      <MediaSection controls={homepageControls} orgName={orgName} settings={siteSettings} />
      <CtaSection />
      <HomepageFooter
        controls={homepageControls}
        notices={data.notices}
        orgName={orgName}
        settings={siteSettings}
        tagline={tagline}
      />
    </>
  )
}

function SectionHeading({ align = 'center', eyebrow, text, title }) {
  const centered = align === 'center'

  return (
    <motion.div
      className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}
      initial="hidden"
      variants={stagger}
      viewport={{ once: true, amount: 0.32 }}
      whileInView="show"
    >
      <motion.p className="premium-eyebrow" variants={fadeUp}>
        <span />
        {eyebrow}
      </motion.p>
      <motion.h2 className="mt-4 text-3xl font-bold leading-tight text-[var(--text-primary)] sm:text-5xl" variants={fadeUp}>
        {title}
      </motion.h2>
      {text ? (
        <motion.p className="mt-4 text-base leading-8 text-[var(--text-secondary)]" variants={fadeUp}>
          {text}
        </motion.p>
      ) : null}
    </motion.div>
  )
}

function StatsBar({ stats }) {
  const items = [
    ['মোট সদস্য', stats.totalMembers, '+', ''],
    ['এই বছরের দান', stats.yearlyDonation, '', '৳'],
    ['সম্পন্ন কার্যক্রম', stats.completedActivities, '+', ''],
    ['বছরের অভিজ্ঞতা', stats.yearsActive, '+', ''],
  ]

  return (
    <section className="premium-stats-bar relative bg-[var(--primary-700)] px-4 py-14 sm:px-6">
      <svg
        aria-hidden="true"
        className="absolute inset-x-0 -top-px h-8 w-full text-[var(--bg-base)]"
        preserveAspectRatio="none"
        viewBox="0 0 1440 80"
      >
        <path d="M0,0 C240,70 460,70 720,26 C980,-18 1190,10 1440,60 L1440,0 Z" fill="currentColor" />
      </svg>
      <motion.div
        className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        variants={stagger}
        viewport={{ once: true, amount: 0.25 }}
        whileInView="show"
      >
        {items.map(([label, value, suffix, prefix], index) => (
          <motion.div
            className={`text-center ${index ? 'lg:border-l lg:border-white/20' : ''}`}
            key={label}
            variants={fadeUp}
          >
            <p className="font-[Inter] text-4xl font-bold text-white sm:text-[2.5rem]">
              {prefix}
              <CountUpNumber value={Number(value || 0)} />
              {suffix}
            </p>
            <p className="mt-2 text-sm font-semibold text-white/70">{label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

function CountUpNumber({ value }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.4 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return undefined

    const duration = 1100
    const start = performance.now()
    let frame = 0

    const tick = (time) => {
      const progress = Math.min((time - start) / duration, 1)
      setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))))

      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, visible])

  return <span ref={ref}>{display.toLocaleString('bn-BD')}</span>
}

function AboutSection({ aboutText, orgName, tagline }) {
  const features = [
    ['স্বচ্ছতা', 'সদস্য, দান ও খরচের তথ্য এক জায়গায় দেখা যায়।', ShieldCheck],
    ['সদস্য সেবা', 'নিবন্ধন, নোটিশ ও কার্যক্রমে দ্রুত অংশগ্রহণ।', Users],
    ['কমিউনিটি উন্নয়ন', 'সমাজসেবা ও স্থানীয় উন্নয়নের পরিকল্পিত উদ্যোগ।', HeartHandshake],
  ]

  return (
    <section className="premium-section bg-[var(--bg-surface)]" id="about">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.96fr_1.04fr]">
        <div>
          <SectionHeading
            align="left"
            eyebrow="ABOUT"
            text={aboutText}
            title={`${orgName} সম্পর্কে`}
          />
          <div className="mt-8 grid gap-4">
            {features.map(([title, text, Icon]) => (
              <motion.div
                className="flex gap-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--soft-row-bg)] p-4"
                initial={{ opacity: 0, y: 16 }}
                key={title}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--success-bg)] text-[var(--accent-ui)]">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
                  <p className="mt-1 text-sm leading-7 text-[var(--text-secondary)]">{text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          className="premium-about-cards relative min-h-[430px]"
          initial={{ opacity: 0, x: 24 }}
          viewport={{ once: true, amount: 0.28 }}
          whileInView={{ opacity: 1, x: 0 }}
        >
          <div aria-hidden="true" className="premium-about-glow" />
          <div className="premium-about-card -rotate-[1.5deg]">
            <span className="premium-feature-icon">
              <Building2 aria-hidden="true" className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-2xl font-bold text-[var(--text-primary)]">এক প্ল্যাটফর্মে পরিচালনা</h3>
            <p className="mt-3 leading-8 text-[var(--text-secondary)]">{tagline}</p>
          </div>
          <div className="premium-about-card premium-about-card-lift rotate-[1deg]">
            <span className="premium-feature-icon">
              <Landmark aria-hidden="true" className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-2xl font-bold text-[var(--text-primary)]">সেবা, হিসাব ও অংশগ্রহণ</h3>
            <p className="mt-3 leading-8 text-[var(--text-secondary)]">
              নোটিশ, মিটিং, দান, গ্যালারি এবং সদস্য কার্যক্রম আধুনিকভাবে সংরক্ষণ ও প্রকাশ করা হয়।
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function MembershipSection({ stats }) {
  const benefits = [
    ['ডিজিটাল সদস্য আইডি', 'সদস্য প্রোফাইল ও পরিচয়পত্র সবসময় প্রস্তুত।', ShieldCheck],
    ['নোটিশ ও ইভেন্ট', 'মিটিং, ট্যুর ও জরুরি নোটিশ সরাসরি পাবেন।', CalendarDays],
    ['স্বচ্ছ হিসাব', 'নিজের ফি, দান এবং রসিদ সহজে ট্র্যাক করুন।', Wallet],
  ]

  return (
    <section className="premium-section bg-[var(--bg-base)]" id="membership">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_420px]">
        <div>
          <SectionHeading
            align="left"
            eyebrow="MEMBERSHIP"
            text="সদস্য হলে পরিষদের সকল নোটিশ, ইভেন্ট, ফি হিসাব এবং কমিউনিটি কার্যক্রমে আপনার অংশগ্রহণ আরও সহজ হবে।"
            title="সদস্যপদ এখন আরও সহজ ও ডিজিটাল"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {benefits.map(([title, text, Icon]) => (
              <motion.div
                className="premium-card p-5"
                initial={{ opacity: 0, y: 20 }}
                key={title}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <span className="premium-feature-icon">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{text}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="premium-btn-primary min-h-12 px-6" to="/register">
              সদস্য আবেদন করুন
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
            <Link className="premium-btn-secondary min-h-12 px-6" to="/login">
              সদস্য লগইন
            </Link>
          </div>
        </div>

        <motion.div
          className="premium-member-pass"
          initial={{ opacity: 0, rotateY: -10, y: 24 }}
          viewport={{ once: true, amount: 0.25 }}
          whileInView={{ opacity: 1, rotateY: 0, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--accent-ui)]">MEMBER CARD</span>
            <span className="rounded-full bg-[var(--success-bg)] px-3 py-1 text-xs font-bold text-[var(--success)]">
              Active
            </span>
          </div>
          <div className="mt-8 flex items-center gap-4">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--border-accent)] bg-[rgba(13,148,136,0.14)] text-2xl font-bold text-[var(--accent-ui)]">
              স
            </span>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">সদস্যের নাম</p>
              <p className="mt-1 font-[Inter] text-sm text-[var(--text-secondary)]">DP-{Number(stats.totalMembers ?? 0).toLocaleString('bn-BD')}</p>
            </div>
          </div>
          <div className="mt-8 grid gap-3">
            {['নিবন্ধন জমা দিন', 'এডমিন অনুমোদন', 'ড্যাশবোর্ড ব্যবহার'].map((step, index) => (
              <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--soft-row-bg)] px-4 py-3" key={step}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--success-bg)] text-sm font-bold text-[var(--accent-ui)]">
                  {Number(index + 1).toLocaleString('bn-BD')}
                </span>
                <span className="font-semibold text-[var(--text-primary)]">{step}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function CountdownSection({ enabled, event }) {
  const eventDate = getEventDate(event)
  const [remaining, setRemaining] = useState(() => calculateRemaining(eventDate))

  useEffect(() => {
    if (!eventDate) return undefined

    const timer = window.setInterval(() => {
      setRemaining(calculateRemaining(eventDate))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [eventDate])

  if (!enabled || !eventDate) return null

  const boxes = [
    ['দিন', remaining.days],
    ['ঘণ্টা', remaining.hours],
    ['মিনিট', remaining.minutes],
    ['সেকেন্ড', remaining.seconds],
  ]

  return (
    <section className="premium-section bg-[var(--bg-base)]">
      <motion.div
        className="premium-countdown-card mx-auto max-w-5xl text-center"
        initial={{ opacity: 0, y: 24 }}
        viewport={{ once: true, amount: 0.25 }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm font-semibold text-[var(--text-secondary)]">পরবর্তী অনুষ্ঠান পর্যন্ত বাকি</p>
        <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
          {event?.title || 'আসন্ন অনুষ্ঠান'}
        </h2>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {boxes.map(([label, value]) => (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-base)] p-4" key={label}>
              <motion.p
                animate={{ rotateX: [0, -18, 0] }}
                className="premium-count-flip font-[Inter] text-3xl font-bold text-[var(--accent-ui)] sm:text-4xl"
                key={`${label}-${value}`}
                transition={{ duration: 0.34 }}
              >
                {Number(value || 0).toLocaleString('bn-BD')}
              </motion.p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

function calculateRemaining(value) {
  const target = value ? new Date(value).getTime() : 0
  const total = Math.max(target - Date.now(), 0)
  const days = Math.floor(total / 86400000)
  const hours = Math.floor((total % 86400000) / 3600000)
  const minutes = Math.floor((total % 3600000) / 60000)
  const seconds = Math.floor((total % 60000) / 1000)

  return { days, hours, minutes, seconds, total }
}

function NoticesSection({ initialNoticeId, loading, notices }) {
  const items = getList(notices).slice(0, 3)

  return (
    <section className="premium-section bg-[var(--bg-base)]" id="notices">
      <SectionHeading
        eyebrow="NOTICE"
        text="সদস্য ও এলাকার জন্য গুরুত্বপূর্ণ ঘোষণা দ্রুত পড়ুন।"
        title="সাম্প্রতিক নোটিশ"
      />
      {loading ? (
        <SkeletonGrid count={3} />
      ) : items.length ? (
        <motion.div
          className="mx-auto mt-12 grid max-w-7xl gap-5 md:grid-cols-3"
          initial="hidden"
          variants={stagger}
          viewport={{ once: true, amount: 0.18 }}
          whileInView="show"
        >
          {items.map((notice) => (
            <NoticeCard active={notice._id === initialNoticeId} key={notice._id || notice.title} notice={notice} />
          ))}
        </motion.div>
      ) : (
        <EmptyState icon={Eye} message="এখন কোনো public নোটিশ নেই।" />
      )}
      <div className="mt-10 text-center">
        <Link className="premium-inline-link" to="/notices">
          সকল নোটিশ
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

function NoticeCard({ active, notice }) {
  const meta = categoryMeta(notice.category)
  const shareUrl = `${window.location.origin}/notices/${notice._id || ''}`

  return (
    <motion.article
      className={`premium-notice-card ${active ? 'ring-2 ring-[var(--primary-400)]' : ''}`}
      style={{
        '--category-bg': meta.bg,
        '--category-color': meta.color,
      }}
      variants={fadeUp}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-[var(--category-bg)] px-3 py-1 text-xs font-bold text-[var(--category-color)]">
          {meta.label}
        </span>
        <span className="text-xs font-semibold text-[var(--text-muted)]">{formatDate(notice.createdAt || notice.publishDate)}</span>
      </div>
      <h3 className="premium-line-clamp-2 mt-5 text-xl font-semibold leading-snug text-[var(--text-primary)]">
        {notice.title}
      </h3>
      <p className="premium-line-clamp-3 mt-3 text-sm leading-7 text-[var(--text-secondary)]">
        {plainText(notice.content || notice.description || notice.body)}
      </p>
      <div className="mt-6 flex items-center justify-between">
        <Link className="premium-inline-link" to={`/notices/${notice._id || ''}`}>
          পড়ুন
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        <button
          aria-label="নোটিশ শেয়ার করুন"
          className="text-[var(--text-muted)] transition hover:text-[var(--accent-ui)]"
          onClick={() => navigator.clipboard?.writeText(shareUrl)}
          type="button"
        >
          <Share2 aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
    </motion.article>
  )
}

function EventsSection({ events, loading, onRsvp }) {
  const items = getList(events).slice(0, 3)

  return (
    <section className="premium-section bg-[var(--bg-surface)]" id="events">
      <SectionHeading
        eyebrow="EVENTS"
        text="আসন্ন মিটিং, ট্যুর এবং সামাজিক কার্যক্রমে অংশ নিন।"
        title="মিটিং ও ট্যুর"
      />
      {loading ? (
        <SkeletonGrid count={3} />
      ) : items.length ? (
        <motion.div
          className="mx-auto mt-12 grid max-w-7xl gap-5 md:grid-cols-3"
          initial="hidden"
          variants={stagger}
          viewport={{ once: true, amount: 0.18 }}
          whileInView="show"
        >
          {items.map((event) => (
            <EventCard event={event} key={`${event.eventType}-${event._id || event.title}`} onRsvp={onRsvp} />
          ))}
        </motion.div>
      ) : (
        <EmptyState icon={CalendarDays} message="আসন্ন ইভেন্ট শীঘ্রই প্রকাশিত হবে।" />
      )}
    </section>
  )
}

function EventCard({ event, onRsvp }) {
  const eventDate = getEventDate(event)
  const isTour = event.eventType === 'tour'
  const remainingSeats = Number(event.maxSeats || 0) - Number(event.registeredCount || event.registrationCount || 0)

  return (
    <motion.article className="premium-event-card" variants={fadeUp}>
      <div className={`premium-event-band ${isTour ? 'is-tour' : ''}`}>
        {isTour ? 'ট্যুর' : 'মিটিং'}
      </div>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="premium-date-badge">
            <span>{eventDate ? new Intl.DateTimeFormat('bn-BD', { day: 'numeric' }).format(new Date(eventDate)) : '--'}</span>
            <small>{eventDate ? new Intl.DateTimeFormat('bn-BD', { month: 'short' }).format(new Date(eventDate)) : ''}</small>
          </div>
          <div className="min-w-0">
            <h3 className="premium-line-clamp-2 text-xl font-semibold text-[var(--text-primary)]">{event.title}</h3>
            <p className="mt-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <MapPin aria-hidden="true" className="h-4 w-4 text-[var(--accent-ui)]" />
              {event.location || 'স্থান পরে জানানো হবে'}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Clock3 aria-hidden="true" className="h-4 w-4 text-[var(--accent-ui)]" />
              {formatTime(eventDate) || 'সময় নির্ধারিত হবে'}
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between gap-3">
          <button className="premium-btn-secondary min-h-11 px-4 text-sm" onClick={() => onRsvp(event)} type="button">
            RSVP
          </button>
          {isTour && remainingSeats > 0 ? (
            <span className="rounded-full bg-[var(--danger-bg)] px-3 py-1 text-xs font-bold text-[var(--danger)]">
              {remainingSeats.toLocaleString('bn-BD')} সিট বাকি
            </span>
          ) : null}
        </div>
      </div>
    </motion.article>
  )
}

function DonationSection({ donation, settings }) {
  const {
    disabled,
    errors,
    form,
    message,
    onAmount,
    onProofUpload,
    onSubmit,
    registerDonation,
    submitting,
    successMessage,
    uploadingProof,
  } = donation
  const selectedAmount = Number(form.amount || 0)
  const paymentInfo = settings.paymentInfo || settings.donationPaymentInfo || 'bKash / Nagad / Bank তথ্য এডমিন সেটিংস থেকে দেখা যাবে।'

  return (
    <section className="premium-section bg-[var(--bg-base)]" id="donate">
      <div className="mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <SectionHeading
            align="left"
            eyebrow="DONATION"
            text="আপনার সহযোগিতা এলাকার শিক্ষা, সামাজিক সহায়তা ও উন্নয়ন কার্যক্রমকে এগিয়ে নেয়।"
            title="দান করুন, পরিবর্তনের অংশ হন"
          />
          <div className="mt-8 grid gap-4">
            {[
              [money(500), 'একজন শিক্ষার্থীর সহায়তা'],
              [money(1000), 'সমাজসেবা কার্যক্রমে অবদান'],
              [money(5000), 'বড় উদ্যোগ বাস্তবায়নে সহায়তা'],
            ].map(([amount, label]) => (
              <div className="premium-impact-row" key={label}>
                <span>{amount}</span>
                <p>{label}</p>
              </div>
            ))}
          </div>
        </div>

        <motion.form
          className="premium-donation-card"
          initial={{ opacity: 0, y: 24 }}
          onSubmit={onSubmit}
          viewport={{ once: true, amount: 0.25 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <input type="hidden" {...registerDonation('proofImageUrl')} />
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">দান ফর্ম</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{paymentInfo}</p>
            </div>
            <span className="premium-feature-icon">
              <Wallet aria-hidden="true" className="h-6 w-6" />
            </span>
          </div>

          {disabled ? (
            <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--warning-bg)] p-4 text-sm font-semibold text-[var(--warning)]">
              public donation আপাতত বন্ধ আছে।
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickAmounts.map((amount) => (
              <button
                className={`premium-amount-button ${selectedAmount === amount ? 'is-selected' : ''}`}
                disabled={disabled}
                key={amount}
                onClick={() => onAmount(amount)}
                type="button"
              >
                {money(amount)}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <FieldShell error={errors.amount?.message} label="পরিমাণ">
              <input className="premium-input" disabled={disabled} type="number" {...registerDonation('amount')} />
            </FieldShell>
            <FieldShell error={errors.method?.message} label="মাধ্যম">
              <select className="premium-input" disabled={disabled} {...registerDonation('method')}>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Bank">Bank</option>
                <option value="Cash">Cash</option>
              </select>
            </FieldShell>
            <FieldShell error={errors.donorName?.message} label="নাম">
              <input className="premium-input" disabled={disabled} placeholder="আপনার নাম" {...registerDonation('donorName')} />
            </FieldShell>
            <FieldShell error={errors.phone?.message} label="ফোন">
              <input className="premium-input" disabled={disabled} placeholder="017XXXXXXXX" {...registerDonation('phone')} />
            </FieldShell>
            <FieldShell error={errors.transactionId?.message} label="ট্রানজেকশন আইডি">
              <input className="premium-input" disabled={disabled} placeholder="Txn ID" {...registerDonation('transactionId')} />
            </FieldShell>
            <FieldShell error={errors.proofImageUrl?.message} label="স্ক্রিনশট">
              <label className="premium-upload-zone">
                <Upload aria-hidden="true" className="h-5 w-5" />
                {uploadingProof ? 'আপলোড হচ্ছে...' : form.proofImageUrl ? 'স্ক্রিনশট যুক্ত হয়েছে' : 'ছবি আপলোড করুন'}
                <input
                  accept="image/*"
                  className="sr-only"
                  disabled={disabled || uploadingProof}
                  onChange={(event) => onProofUpload(event.target.files?.[0])}
                  type="file"
                />
              </label>
            </FieldShell>
            <FieldShell className="sm:col-span-2" error={errors.note?.message} label="বার্তা">
              <textarea
                className="premium-input min-h-24 resize-none"
                disabled={disabled}
                placeholder="ঐচ্ছিক বার্তা"
                {...registerDonation('note')}
              />
            </FieldShell>
          </div>

          {message ? <p className="mt-4 rounded-[var(--radius-lg)] bg-[var(--danger-bg)] p-3 text-sm font-semibold text-[var(--danger)]">{message}</p> : null}
          {successMessage ? <p className="mt-4 rounded-[var(--radius-lg)] bg-[var(--success-bg)] p-3 text-sm font-semibold text-[var(--success)]">{successMessage}</p> : null}

          <button className="premium-btn-primary mt-6 min-h-12 w-full justify-center" disabled={disabled || submitting} type="submit">
            <Send aria-hidden="true" className="h-5 w-5" />
            {submitting ? 'জমা হচ্ছে...' : 'দান জমা দিন'}
          </button>
        </motion.form>
      </div>
    </section>
  )
}

function FieldShell({ children, className = '', error, label }) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-sm font-semibold text-[var(--text-secondary)]">{label}</span>
      {children}
      {error ? <span className="text-xs font-semibold text-[var(--danger)]">{error}</span> : null}
    </label>
  )
}

function GallerySection({ gallery, loading }) {
  const [index, setIndex] = useState(-1)
  const items = getList(gallery).slice(0, 6)
  const slides = items.map((item) => ({ src: getImageUrl(item), title: item.caption || item.title }))

  return (
    <section className="premium-section bg-[var(--bg-surface)]" id="gallery">
      <SectionHeading
        eyebrow="GALLERY"
        text="স্মরণীয় মুহূর্ত, কার্যক্রম এবং কমিউনিটির ছবি।"
        title="গ্যালারি"
      />
      {loading ? (
        <SkeletonGrid count={6} />
      ) : items.length ? (
        <motion.div
          className="mx-auto mt-12 grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          variants={stagger}
          viewport={{ once: true, amount: 0.15 }}
          whileInView="show"
        >
          {items.map((item, itemIndex) => {
            const imageUrl = getImageUrl(item)

            return (
              <motion.button
                className="premium-gallery-tile"
                key={item._id || imageUrl || itemIndex}
                onClick={() => setIndex(itemIndex)}
                type="button"
                variants={fadeUp}
              >
                {imageUrl ? <img alt={item.caption || item.title || 'Gallery'} src={imageUrl} /> : <ImageIcon aria-hidden="true" className="h-10 w-10 text-[var(--accent-ui)]" />}
                <span>
                  <Eye aria-hidden="true" className="h-5 w-5" />
                </span>
              </motion.button>
            )
          })}
        </motion.div>
      ) : (
        <EmptyState icon={ImageIcon} message="গ্যালারিতে ছবি যোগ করা হবে।" />
      )}
      <Lightbox close={() => setIndex(-1)} index={index} open={index >= 0} slides={slides} />
    </section>
  )
}

function CommitteeSection({ enabled, members }) {
  const items = getList(members).slice(0, 5)

  if (!enabled) return null

  return (
    <section className="premium-section bg-[var(--bg-base)]" id="committee">
      <SectionHeading
        eyebrow="COMMITTEE"
        text="পরিষদের দায়িত্বশীল সদস্যবৃন্দ।"
        title="কমিটি"
      />
      {items.length ? (
        <motion.div
          className="mx-auto mt-12 grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-5"
          initial="hidden"
          variants={stagger}
          viewport={{ once: true, amount: 0.18 }}
          whileInView="show"
        >
          {items.map((member, index) => {
            const name = getName(member)
            const position = member.position || member.role || 'সদস্য'
            const president = index === 0 || String(position).includes('সভাপতি') || String(position).toLowerCase().includes('president')
            const photo = getImageUrl(member)

            return (
              <motion.article className={`premium-committee-card ${president ? 'is-president' : ''}`} key={member._id || name} variants={fadeUp}>
                {photo ? (
                  <img alt={name} className="mx-auto h-24 w-24 rounded-full object-cover" src={photo} />
                ) : (
                  <span className="premium-committee-avatar">{initials(name)}</span>
                )}
                <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">{name}</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{position}</p>
                {president ? (
                  <span className="mt-4 inline-flex rounded-full bg-[var(--success-bg)] px-3 py-1 text-xs font-bold text-[var(--accent-ui)]">
                    সভাপতি
                  </span>
                ) : null}
              </motion.article>
            )
          })}
        </motion.div>
      ) : (
        <EmptyState icon={Users} message="কমিটি তালিকা শীঘ্রই প্রকাশিত হবে।" />
      )}
    </section>
  )
}

function TestimonialsSection({ enabled, items }) {
  const testimonials = getList(items)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || testimonials.length < 2) return undefined

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % testimonials.length)
    }, 4000)

    return () => window.clearInterval(timer)
  }, [paused, testimonials.length])

  if (!enabled) return null

  const current = testimonials[active]

  return (
    <section className="premium-section bg-[var(--bg-surface)]" id="testimonials">
      <SectionHeading
        eyebrow="TESTIMONIAL"
        text="সদস্যদের অভিজ্ঞতা ও অনুভূতি।"
        title="মানুষের আস্থা"
      />
      {current ? (
        <motion.div
          className="premium-testimonial-card mx-auto mt-12 max-w-4xl"
          initial={{ opacity: 0, y: 24 }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          viewport={{ once: true, amount: 0.2 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Quote aria-hidden="true" className="mx-auto h-12 w-12 text-[var(--accent-ui)]" />
          <motion.p
            animate={{ opacity: 1 }}
            className="mt-6 text-center text-xl italic leading-9 text-[var(--text-secondary)]"
            initial={{ opacity: 0 }}
            key={current._id || active}
          >
            “{current.text || current.message || current.content}”
          </motion.p>
          <div className="mt-8 flex items-center justify-center gap-4">
            {getImageUrl(current) ? (
              <img alt={getName(current)} className="h-14 w-14 rounded-full object-cover" src={getImageUrl(current)} />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--success-bg)] font-bold text-[var(--accent-ui)]">
                {initials(getName(current))}
              </span>
            )}
            <div>
              <p className="font-semibold text-[var(--text-primary)]">{getName(current)}</p>
              <p className="text-sm text-[var(--text-muted)]">যোগদান {current.joinYear || current.year || '----'}</p>
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-2">
            {testimonials.map((item, index) => (
              <button
                aria-label={`${index + 1} নম্বর মতামত দেখুন`}
                className={`h-2.5 w-2.5 rounded-full border border-[var(--accent-ui)] ${index === active ? 'bg-[var(--accent-ui)]' : 'bg-transparent'}`}
                key={item._id || index}
                onClick={() => setActive(index)}
                type="button"
              />
            ))}
          </div>
        </motion.div>
      ) : (
        <EmptyState icon={Quote} message="সদস্য মতামত শীঘ্রই যুক্ত হবে।" />
      )}
    </section>
  )
}

function MediaSection({ controls, orgName, settings }) {
  const youtubeUrl = controls.youtubeUrl || settings.youtubeUrl
  const youtubeEmbed = controls.youtubeEnabled !== false ? toYoutubeEmbed(youtubeUrl) : ''
  const mapUrl = controls.googleMapsEnabled !== false ? extractIframeSrc(controls.googleMapsEmbedUrl || settings.googleMapsEmbedUrl) : ''

  if (!youtubeEmbed && !mapUrl) return null

  return (
    <section className="premium-section bg-[var(--bg-base)]">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
        {youtubeEmbed ? (
          <div className="premium-media-card">
            <div className="mb-4 flex items-center gap-3">
              <PlayCircle aria-hidden="true" className="h-6 w-6 text-[var(--accent-ui)]" />
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{controls.youtubeTitle || `${orgName} ভিডিও`}</h2>
            </div>
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full rounded-[var(--radius-xl)]"
              src={youtubeEmbed}
              title={controls.youtubeTitle || orgName}
            />
          </div>
        ) : null}
        {mapUrl ? (
          <div className="premium-media-card">
            <div className="mb-4 flex items-center gap-3">
              <MapPin aria-hidden="true" className="h-6 w-6 text-[var(--accent-ui)]" />
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">আমাদের অবস্থান</h2>
            </div>
            <iframe
              className="aspect-video w-full rounded-[var(--radius-xl)]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={mapUrl}
              title={`${orgName} মানচিত্র`}
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}

function CtaSection() {
  return (
    <section className="premium-cta-section px-4 py-20 sm:px-6">
      <motion.div
        className="mx-auto max-w-5xl text-center"
        initial={{ opacity: 0, y: 24 }}
        viewport={{ once: true, amount: 0.25 }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold leading-tight text-white sm:text-5xl">
          আজই যুক্ত হন, এলাকার উন্নয়নে অংশ নিন
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/80">
          নিবন্ধন, নোটিশ, দান ও কার্যক্রম সবকিছু এক জায়গায় সহজভাবে পরিচালনা করুন।
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-4 text-sm font-semibold text-white">
          {['ডিজিটাল সদস্যপদ', 'স্বচ্ছ আর্থিক হিসাব', 'দ্রুত নোটিশ ও ইভেন্ট'].map((item) => (
            <span className="inline-flex items-center gap-2" key={item}>
              <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
              {item}
            </span>
          ))}
        </div>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-xl)] bg-white px-7 font-bold text-[var(--primary-700)] transition hover:-translate-y-0.5" to="/register">
            সদস্য হন
          </Link>
          <a className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-xl)] border border-white/35 px-7 font-bold text-white transition hover:bg-white/10" href="#donate">
            দান করুন
          </a>
        </div>
      </motion.div>
    </section>
  )
}

function HomepageFooter({ controls, notices, orgName, settings, tagline }) {
  const recentNotices = getList(notices).slice(0, 3)
  const socials = [
    ['Facebook', settings.facebookUrl || controls.facebookPageUrl, MessageCircle],
    ['YouTube', settings.youtubeUrl || controls.youtubeUrl, PlayCircle],
    ['WhatsApp', settings.whatsappGroupUrl, Send],
  ].filter(([, href]) => href)

  return (
    <footer className="premium-footer px-4 pt-16 sm:px-6" id="contact">
      <div className="mx-auto grid max-w-7xl gap-10 pb-10 lg:grid-cols-[1.15fr_0.8fr_0.9fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="premium-logo-box">
              <Star aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-[var(--text-primary)]">{orgName}</h2>
              <p className="mt-0.5 truncate text-sm font-semibold text-[var(--text-accent)]">{ORG_NAME_BN}</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm leading-8 text-[var(--text-muted)]">{tagline}</p>
          <div className="mt-5 flex gap-3">
            {socials.map(([label, href, Icon]) => (
              <a
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:text-[var(--accent-ui)]"
                href={href}
                key={label}
                rel="noreferrer"
                target="_blank"
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="premium-footer-title">দ্রুত লিংক</h3>
          <div className="mt-4 grid gap-3">
            {[
              ['হোম', '#home'],
              ['আমাদের সম্পর্কে', '#about'],
              ['সদস্যপদ', '#membership'],
              ['দান', '#donate'],
              ['গ্যালারি', '#gallery'],
            ].map(([label, href]) => (
              <a className="premium-footer-link" href={href} key={href}>
                {label}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="premium-footer-title">সাম্প্রতিক নোটিশ</h3>
          <div className="mt-4 grid gap-3">
            {recentNotices.length ? (
              recentNotices.map((notice) => (
                <Link className="premium-footer-link premium-line-clamp-2" key={notice._id || notice.title} to={`/notices/${notice._id || ''}`}>
                  {notice.title}
                </Link>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)]">নোটিশ শীঘ্রই যুক্ত হবে।</p>
            )}
          </div>
        </div>
        <div>
          <h3 className="premium-footer-title">যোগাযোগ</h3>
          <div className="mt-4 grid gap-3 text-sm text-[var(--text-secondary)]">
            <ContactLine icon={MapPin} text={settings.address || 'Dargah Para'} />
            <ContactLine
              icon={Phone}
              text={settings.phone || settings.contactNumber || settings.whatsappNumber || 'ফোন নম্বর যুক্ত হবে'}
            />
            <ContactLine icon={Mail} text={settings.email || 'ইমেইল যুক্ত হবে'} />
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-white/[0.04] py-5 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-1">
          <p>© {new Date().getFullYear()} {orgName}. সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="font-semibold text-[var(--text-secondary)]">{DEVELOPER_CREDIT_TEXT}</p>
        </div>
        <div className="flex gap-4">
          <a className="hover:text-[var(--accent-ui)]" href="#home">Privacy</a>
          <a className="hover:text-[var(--accent-ui)]" href="#home">Terms</a>
        </div>
      </div>
    </footer>
  )
}

function ContactLine({ icon: Icon, text }) {
  return (
    <p className="flex items-start gap-3">
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-ui)]" />
      <span>{text}</span>
    </p>
  )
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="mx-auto mt-12 max-w-xl rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--success-bg)] text-[var(--accent-ui)]">
        <Icon aria-hidden="true" className="h-7 w-7" />
      </span>
      <p className="mt-4 font-semibold text-[var(--text-secondary)]">{message}</p>
    </div>
  )
}

function SkeletonGrid({ count = 3 }) {
  return (
    <div className="mx-auto mt-12 grid max-w-7xl gap-5 md:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div className="home-skeleton-block h-56" key={index} />
      ))}
    </div>
  )
}
