import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Lightbox from 'yet-another-react-lightbox'
import Download from 'yet-another-react-lightbox/plugins/download'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import { FacebookShareButton, WhatsappShareButton } from 'react-share'
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Quote,
  Share2,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, transition: { duration: 0.48, ease: 'easeOut' }, y: 0 },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

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

const plainText = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const getList = (value) => (Array.isArray(value) ? value : [])

const getShareUrl = (notice) =>
  `${window.location.origin}/notices/${notice?._id || ''}`

const normalizeWhatsAppNumber = (phone = '') => {
  const digits = String(phone).replace(/\D/g, '')

  if (!digits) return ''
  if (digits.startsWith('880')) return digits
  if (digits.startsWith('0')) return `88${digits}`
  return digits
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

const getEventDate = (event) => event?.date || event?.meetingDate || event?.startDate

function SectionHeading({ eyebrow, title, text }) {
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

function InitialsAvatar({ name, photo, className = '' }) {
  if (photo) {
    return <img alt={name} className={`rounded-full object-cover ${className}`} src={photo} />
  }

  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 ${className}`}>
      {String(name || 'স').slice(0, 1)}
    </span>
  )
}

export function NewsTicker({ enabled, notices }) {
  const items = getList(notices).slice(0, 5)

  if (!enabled || !items.length) return null

  return (
    <div className="fixed inset-x-0 top-20 z-40 flex h-9 items-center overflow-hidden bg-indigo-600 text-sm text-white shadow-sm">
      <div className="flex h-full shrink-0 items-center gap-2 border-r border-white/30 px-4 font-bold">
        <span>📢</span>
        <span>নোটিশ:</span>
      </div>
      <div className="group min-w-0 flex-1 overflow-hidden">
        <div className="ticker-track flex w-max items-center gap-6 whitespace-nowrap px-6 group-hover:[animation-play-state:paused]">
          {[...items, ...items].map((notice, index) => (
            <a className="hover:underline" href="#notices" key={`${notice._id}-${index}`}>
              {notice.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CountdownSection({ enabled, event }) {
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

  const running = remaining.total <= 0
  const boxes = [
    ['দিন', remaining.days],
    ['ঘণ্টা', remaining.hours],
    ['মিনিট', remaining.minutes],
    ['সেকেন্ড', remaining.seconds],
  ]

  return (
    <section className="bg-white px-4 py-10 sm:px-6">
      <motion.div
        className="mx-auto max-w-5xl rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8"
        initial={{ opacity: 0, y: 24 }}
        viewport={{ once: true, amount: 0.25 }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">
          পরবর্তী অনুষ্ঠান পর্যন্ত বাকি
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">
          {event?.title || 'আসন্ন অনুষ্ঠান'}
        </h2>
        {running ? (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
            অনুষ্ঠান চলছে!
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {boxes.map(([label, value]) => (
              <motion.div
                animate={{ rotateX: [0, -14, 0] }}
                className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4"
                key={label}
                transition={{ duration: 0.32 }}
              >
                <p className="text-4xl font-bold tabular-nums text-indigo-700">
                  {Number(value || 0).toLocaleString('bn-BD')}
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-500">{label}</p>
              </motion.div>
            ))}
          </div>
        )}
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

export function TrustBadgeSection({ controls, orgName }) {
  const labels = getList(controls?.trustBadgeLabels)
  const badges = labels.length
    ? labels
    : ['যাচাইকৃত সংগঠন', 'স্বচ্ছ আর্থিক কার্যক্রম', 'নিরাপদ সদস্য নিবন্ধন']
  const [open, setOpen] = useState(false)

  if (!controls?.trustBadgesEnabled && !controls?.certificateEnabled) return null

  return (
    <section className="bg-white px-4 py-16 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_380px]">
        <motion.div
          className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6 shadow-sm"
          initial={{ opacity: 0, y: 24 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">
            নিবন্ধন ও স্বীকৃতি
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
            বিশ্বাসের ভিত্তিতে পরিচালিত {orgName}
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {controls?.trustBadgesEnabled
              ? badges.map((badge) => (
                  <span
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-700"
                    key={badge}
                  >
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    {badge}
                  </span>
                ))
              : null}
          </div>
        </motion.div>
        {controls?.certificateEnabled && controls?.certificateImageUrl ? (
          <>
            <button
              className="group overflow-hidden rounded-3xl border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              onClick={() => setOpen(true)}
              type="button"
            >
              <img
                alt="Registration certificate"
                className="h-72 w-full rounded-2xl object-cover transition group-hover:scale-[1.02]"
                src={controls.certificateImageUrl}
              />
            </button>
            <Lightbox
              close={() => setOpen(false)}
              open={open}
              plugins={[Zoom, Download]}
              slides={[{ src: controls.certificateImageUrl }]}
            />
          </>
        ) : null}
      </div>
    </section>
  )
}

export function CommitteeSection({ enabled, members }) {
  const items = getList(members)
  if (!enabled || !items.length) return null

  return (
    <section className="bg-gray-50 px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow="কমিটি"
        text="যারা সংগঠনকে এগিয়ে নিয়ে যাচ্ছেন"
        title="আমাদের পরিচালনা কমিটি"
      />
      <motion.div
        className="mx-auto mt-10 grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        variants={stagger}
        viewport={{ once: true, amount: 0.2 }}
        whileInView="show"
      >
        {items.map((member, index) => (
          <motion.article
            className={`rounded-3xl border bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md ${
              index === 0 ? 'md:col-span-2 lg:col-span-1 lg:scale-105' : 'border-gray-200'
            }`}
            key={member._id}
            variants={fadeUp}
          >
            <InitialsAvatar className="mx-auto h-24 w-24 text-3xl" name={member.name} photo={member.photo} />
            <h3 className="mt-5 text-xl font-semibold tracking-tight text-gray-950">{member.name}</h3>
            <p className="mt-1 text-sm font-bold text-indigo-700">{member.position}</p>
            {member.showPhone && member.phone ? (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-600">
                <Phone aria-hidden="true" className="h-4 w-4" />
                {member.phone}
              </p>
            ) : null}
          </motion.article>
        ))}
      </motion.div>
    </section>
  )
}

export function AchievementsSection({ enabled, items }) {
  const achievements = getList(items)
  if (!enabled || !achievements.length) return null

  return (
    <section className="bg-white px-4 py-24 sm:px-6" id="gallery">
      <SectionHeading
        eyebrow="মাইলফলক"
        text="সংগঠনের গুরুত্বপূর্ণ অর্জন, উদ্যোগ এবং স্মরণীয় সময়"
        title="আমাদের অর্জন ও মাইলফলক"
      />
      <div className="relative mx-auto mt-12 max-w-5xl">
        <div className="absolute left-5 top-0 h-full w-px bg-indigo-100 md:left-1/2" />
        <motion.div
          className="grid gap-8"
          initial="hidden"
          variants={stagger}
          viewport={{ once: true, amount: 0.15 }}
          whileInView="show"
        >
          {achievements.map((item, index) => (
            <motion.article
              className={`relative grid gap-4 md:grid-cols-2 ${index % 2 ? 'md:text-left' : 'md:text-right'}`}
              key={item._id}
              variants={fadeUp}
            >
              <div className={`${index % 2 ? 'md:order-2' : ''} pl-14 md:pl-0`}>
                <div className="rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm">
                  <span className="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-indigo-600 px-3 font-bold text-white">
                    {item.year}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight text-gray-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-gray-500">{item.description}</p>
                  {item.photo ? <img alt={item.title} className="mt-4 h-44 w-full rounded-2xl object-cover" src={item.photo} /> : null}
                </div>
              </div>
              <span className="absolute left-5 top-7 h-4 w-4 -translate-x-1/2 rounded-full border-4 border-white bg-indigo-600 md:left-1/2" />
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export function TestimonialsSection({ enabled, items }) {
  const testimonials = getList(items)
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!enabled || testimonials.length < 2) return undefined

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % testimonials.length)
    }, 4000)

    return () => window.clearInterval(timer)
  }, [enabled, testimonials.length])

  if (!enabled || !testimonials.length) return null

  const current = testimonials[active] || testimonials[0]

  return (
    <section className="bg-indigo-50 px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow="প্রশংসাপত্র"
        text="সংগঠনের সদস্যদের অভিজ্ঞতা এবং অনুভূতি"
        title="সদস্যরা কী বলছেন"
      />
      <motion.div
        className="mx-auto mt-10 max-w-3xl rounded-3xl border border-indigo-100 bg-white p-8 text-center shadow-sm"
        initial={{ opacity: 0, y: 24 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            initial={{ opacity: 0, y: 12 }}
            key={current._id}
          >
            <Quote aria-hidden="true" className="mx-auto h-10 w-10 text-indigo-300" />
            <p className="mt-5 text-xl leading-10 text-gray-700">“{current.text}”</p>
            <div className="mt-7 flex items-center justify-center gap-3">
              <InitialsAvatar className="h-14 w-14 text-xl" name={current.name} photo={current.photo} />
              <div className="text-left">
                <p className="font-semibold text-gray-950">{current.name}</p>
                <p className="text-sm text-gray-500">{current.joinYear ? `${current.joinYear} থেকে সদস্য` : 'সদস্য'}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="mt-7 flex justify-center gap-2">
          {testimonials.map((item, index) => (
            <button
              aria-label={`${index + 1} নম্বর প্রশংসাপত্র`}
              className={`h-2.5 rounded-full transition ${active === index ? 'w-8 bg-indigo-600' : 'w-2.5 bg-indigo-200'}`}
              key={item._id}
              onClick={() => setActive(index)}
              type="button"
            />
          ))}
        </div>
      </motion.div>
    </section>
  )
}

export function NoticePreviewSection({ initialNoticeId, loading, notices }) {
  const navigate = useNavigate()
  const [activeNoticeId, setActiveNoticeId] = useState('')
  const [shareMenu, setShareMenu] = useState('')
  const selectedNoticeId = activeNoticeId || initialNoticeId || ''
  const selectedNotice = notices.find((item) => item._id === selectedNoticeId) || null

  const openNotice = (notice) => {
    setActiveNoticeId(notice._id)
    navigate(`/notices/${notice._id}`)
  }

  const closeNotice = () => {
    setActiveNoticeId('')
    navigate('/')
  }

  const copyNoticeLink = async (notice) => {
    await navigator.clipboard.writeText(getShareUrl(notice))
    toast.success('লিংক কপি হয়েছে!')
    setShareMenu('')
  }

  return (
    <section className="bg-gray-50 px-4 py-24 sm:px-6" id="notices">
      <SectionHeading
        eyebrow="নোটিশ"
        text="সংগঠনের সর্বশেষ ঘোষণা, নির্দেশনা এবং জনসাধারণের জন্য প্রকাশিত আপডেট"
        title="সর্বশেষ নোটিশ ও ঘোষণা"
      />
      {loading ? (
        <div className="mx-auto mt-10 grid max-w-7xl gap-6 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div className="h-60 animate-pulse rounded-3xl bg-white" key={item} />
          ))}
        </div>
      ) : notices.length ? (
        <motion.div
          className="mx-auto mt-10 grid max-w-7xl gap-6 md:grid-cols-3"
          initial="hidden"
          variants={stagger}
          viewport={{ once: true, amount: 0.2 }}
          whileInView="show"
        >
          {notices.slice(0, 3).map((notice) => (
            <motion.article
              className="group relative cursor-pointer rounded-3xl border border-gray-200 border-l-4 border-l-indigo-600 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
              key={notice._id}
              onClick={() => openNotice(notice)}
              variants={fadeUp}
            >
              <button
                aria-label="নোটিশ শেয়ার করুন"
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition hover:bg-indigo-50 hover:text-indigo-700"
                onClick={(event) => {
                  event.stopPropagation()
                  setShareMenu((current) => (current === notice._id ? '' : notice._id))
                }}
                type="button"
              >
                <Share2 aria-hidden="true" className="h-4 w-4" />
              </button>
              {shareMenu === notice._id ? (
                <NoticeShareMenu notice={notice} onCopy={copyNoticeLink} />
              ) : null}
              <div className="flex items-center justify-between gap-3 pr-12">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                  {notice.category || 'সাধারণ'}
                </span>
                <span className="text-xs font-semibold text-gray-400">{formatDate(notice.createdAt)}</span>
              </div>
              <h3 className="mt-5 line-clamp-2 text-xl font-semibold tracking-tight text-gray-950">
                {notice.title}
              </h3>
              <p className="mt-3 line-clamp-3 text-sm leading-7 text-gray-500">
                {plainText(notice.richBody || notice.body)}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-700">
                বিস্তারিত পড়ুন <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </span>
            </motion.article>
          ))}
        </motion.div>
      ) : null}
      <NoticeModal notice={selectedNotice} onClose={closeNotice} onCopy={copyNoticeLink} />
    </section>
  )
}

function NoticeShareMenu({ notice, onCopy }) {
  const shareUrl = getShareUrl(notice)

  return (
    <div
      className="absolute right-4 top-16 z-20 grid w-56 gap-1 rounded-2xl border border-gray-200 bg-white p-2 text-sm font-semibold text-gray-700 shadow-xl"
      onClick={(event) => event.stopPropagation()}
    >
      <button className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-left hover:bg-gray-50" onClick={() => onCopy(notice)} type="button">
        <Copy aria-hidden="true" className="h-4 w-4" />
        লিংক কপি করুন
      </button>
      <WhatsappShareButton className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-left hover:bg-gray-50" title={notice.title} url={shareUrl}>
        <MessageCircle aria-hidden="true" className="h-4 w-4" />
        WhatsApp-এ শেয়ার করুন
      </WhatsappShareButton>
      <FacebookShareButton className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-left hover:bg-gray-50" url={shareUrl}>
        <span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-blue-600 text-[10px] font-bold text-white">
          f
        </span>
        Facebook-এ শেয়ার করুন
      </FacebookShareButton>
    </div>
  )
}

function NoticeModal({ notice, onClose, onCopy }) {
  if (!notice) return null

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.article
          animate={{ opacity: 1, scale: 1 }}
          className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          exit={{ opacity: 0, scale: 0.94 }}
          initial={{ opacity: 0, scale: 0.94 }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                <Building2 aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
                  দরগাহ পাড়া ঐক্য পরিষদ
                </p>
                <p className="text-sm text-gray-500">{formatDate(notice.createdAt)}</p>
              </div>
            </div>
            <button className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200" onClick={onClose} type="button">
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              {notice.category || 'সাধারণ'}
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950">{notice.title}</h2>
          {notice.imageUrl ? <img alt={notice.title} className="mt-5 max-h-96 w-full rounded-2xl object-cover" src={notice.imageUrl} /> : null}
          <div
            className="home-prose mt-5 text-gray-600"
            dangerouslySetInnerHTML={{ __html: notice.richBody || notice.body }}
          />
          <div className="mt-7 flex flex-wrap justify-end gap-3">
            <button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-300 px-4 text-sm font-bold text-gray-700 hover:bg-gray-50" onClick={() => onCopy(notice)} type="button">
              <Copy aria-hidden="true" className="h-4 w-4" />
              শেয়ার লিংক কপি
            </button>
            <button className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700" onClick={onClose} type="button">
              বন্ধ করুন
            </button>
          </div>
        </motion.article>
      </motion.div>
    </AnimatePresence>
  )
}

export function GalleryPreviewSection({ downloadEnabled, gallery, loading }) {
  const [index, setIndex] = useState(-1)
  const slides = getList(gallery)
    .slice(0, 12)
    .map((item) => ({ description: item.description, src: item.imageUrl, title: item.title }))

  return (
    <section className="bg-white px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow="গ্যালারি"
        text="সামাজিক কাজ, মিটিং, শিক্ষা কার্যক্রম এবং এলাকার উদ্যোগের স্মৃতি"
        title="আমাদের কার্যক্রমের ছবি"
      />
      {loading ? (
        <div className="mx-auto mt-10 h-80 max-w-7xl animate-pulse rounded-3xl bg-gray-100" />
      ) : slides.length ? (
        <motion.div
          className="mx-auto mt-10 columns-1 gap-5 space-y-5 sm:columns-2 lg:columns-3"
          initial="hidden"
          variants={stagger}
          viewport={{ once: true, amount: 0.15 }}
          whileInView="show"
        >
          {slides.slice(0, 6).map((item, currentIndex) => (
            <motion.button
              className="group relative w-full break-inside-avoid overflow-hidden rounded-3xl bg-indigo-100 text-left shadow-sm"
              key={item.src}
              onClick={() => setIndex(currentIndex)}
              type="button"
              variants={fadeUp}
            >
              <img
                alt={item.title}
                className={`w-full object-cover transition duration-500 group-hover:scale-105 ${currentIndex % 3 === 0 ? 'h-80' : 'h-60'}`}
                src={item.src}
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-gray-950/70 to-transparent p-5 opacity-0 transition group-hover:opacity-100">
                <p className="font-semibold text-white">{item.title}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      ) : null}
      <div className="mt-10 text-center">
        <Link className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gray-950 px-6 text-sm font-semibold text-white transition hover:bg-indigo-700" to="/login">
          সম্পূর্ণ গ্যালারি দেখুন <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
        </Link>
      </div>
      <Lightbox
        close={() => setIndex(-1)}
        index={index}
        open={index >= 0}
        plugins={downloadEnabled ? [Thumbnails, Zoom, Download] : [Thumbnails, Zoom]}
        render={{
          buttonDownload: downloadEnabled
            ? undefined
            : () => null,
        }}
        slides={slides}
      />
    </section>
  )
}

export function YoutubeSection({ controls }) {
  const src = toYoutubeEmbed(controls?.youtubeUrl)

  if (!controls?.youtubeEnabled || !src) return null

  return (
    <section className="bg-white px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow="ভিডিও"
        text={controls.youtubeDescription || 'আমাদের কার্যক্রমের নির্বাচিত ভিডিও দেখুন'}
        title={controls.youtubeTitle || 'আমাদের কার্যক্রমের ভিডিও'}
      />
      <motion.div
        className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl"
        initial={{ opacity: 0, scale: 0.96 }}
        viewport={{ once: true, amount: 0.25 }}
        whileInView={{ opacity: 1, scale: 1 }}
      >
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="aspect-video w-full"
          src={src}
          title={controls.youtubeTitle || 'YouTube video'}
        />
      </motion.div>
    </section>
  )
}

export function PartnersSection({ enabled, partners }) {
  const items = getList(partners)
  if (!enabled || !items.length) return null

  return (
    <section className="bg-gray-50 px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="সহযোগী"
        text="যেসব প্রতিষ্ঠান আমাদের কাজকে শক্তিশালী করে"
        title="আমাদের সহযোগী প্রতিষ্ঠান"
      />
      <div className="mx-auto mt-10 max-w-7xl overflow-hidden">
        <div className={`flex items-center gap-5 ${items.length > 6 ? 'partner-marquee w-max' : 'justify-center flex-wrap'}`}>
          {[...items, ...(items.length > 6 ? items : [])].map((partner, index) => {
            const logo = (
              <img
                alt={partner.name}
                className="h-14 max-w-36 object-contain grayscale transition duration-300 hover:scale-105 hover:grayscale-0"
                src={partner.logo}
              />
            )

            return partner.websiteUrl ? (
              <a className="rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm" href={partner.websiteUrl} key={`${partner._id}-${index}`} rel="noreferrer" target="_blank">
                {logo}
              </a>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm" key={`${partner._id}-${index}`}>
                {logo}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function GoogleMapSection({ controls, orgName, siteSettings }) {
  if (!controls?.googleMapsEnabled) return null

  const src = extractIframeSrc(controls.googleMapsEmbedUrl)
  const address = siteSettings?.address || 'Dargah Para, Bangladesh'
  const phone = siteSettings?.contactNumber || controls?.whatsappNumber || ''
  const email = siteSettings?.email || ''

  return (
    <section className="bg-white px-4 py-24 sm:px-6" id="contact">
      <SectionHeading
        eyebrow="অবস্থান"
        text="আমাদের অফিস ও যোগাযোগের ঠিকানা"
        title="আমাদের অবস্থান"
      />
      <div className="mx-auto mt-10 grid max-w-7xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[380px_1fr]">
        <div className="grid gap-4 bg-indigo-50 p-6 sm:p-8">
          <Building2 aria-hidden="true" className="h-10 w-10 text-indigo-600" />
          <h3 className="text-2xl font-semibold tracking-tight text-gray-950">{orgName}</h3>
          <p className="flex gap-3 text-sm leading-7 text-gray-600">
            <MapPin aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-indigo-600" />
            {address}
          </p>
          {phone ? (
            <p className="flex items-center gap-3 text-sm font-semibold text-gray-600">
              <Phone aria-hidden="true" className="h-5 w-5 text-indigo-600" />
              {phone}
            </p>
          ) : null}
          {email ? (
            <p className="flex items-center gap-3 text-sm font-semibold text-gray-600">
              <Mail aria-hidden="true" className="h-5 w-5 text-indigo-600" />
              {email}
            </p>
          ) : null}
          <a
            className="mt-2 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
            rel="noreferrer"
            target="_blank"
          >
            Directions <ExternalLink aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
        {src ? (
          <iframe
            className="h-[400px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={src}
            title={`${orgName} map`}
          />
        ) : (
          <div className="flex h-[400px] items-center justify-center bg-gray-50 p-8 text-center">
            <div>
              <MapPin aria-hidden="true" className="mx-auto h-12 w-12 text-indigo-300" />
              <p className="mt-4 text-lg font-semibold text-gray-950">ম্যাপ URL সেট করা হয়নি</p>
              <p className="mt-2 text-sm text-gray-500">{address}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export function FacebookPageSection({ controls }) {
  if (!controls?.facebookEmbedEnabled || !controls?.facebookPageUrl) return null

  const src = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
    controls.facebookPageUrl,
  )}&tabs=timeline&width=500&height=520&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`

  return (
    <section className="bg-white px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="Facebook"
        text="আমাদের সর্বশেষ সামাজিক আপডেট"
        title="আমাদের Facebook পেজ"
      />
      <div className="mx-auto mt-10 flex max-w-3xl justify-center overflow-hidden rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
        <iframe
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          className="h-[520px] w-full max-w-[500px]"
          loading="lazy"
          src={src}
          title="Facebook page"
        />
      </div>
    </section>
  )
}

export function WhatsAppFloatingButton({ controls, siteSettings }) {
  if (!controls?.whatsappButtonEnabled) return null

  const number = normalizeWhatsAppNumber(controls.whatsappNumber || siteSettings?.contactNumber)
  if (!number) return null

  return (
    <a
      aria-label="WhatsApp"
      className="whatsapp-float group fixed bottom-20 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--success)] text-white shadow-xl transition hover:scale-110 md:bottom-6"
      href={`https://wa.me/${number}`}
      rel="noreferrer"
      target="_blank"
    >
      <span className="pointer-events-none absolute right-16 scale-95 rounded-xl bg-gray-950 px-3 py-2 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:scale-100 group-hover:opacity-100">
        আমাদের সাথে যোগাযোগ করুন
      </span>
      <svg aria-hidden="true" className="h-8 w-8" fill="currentColor" viewBox="0 0 32 32">
        <path d="M16.04 3C9.05 3 3.36 8.68 3.36 15.67c0 2.24.59 4.42 1.72 6.35L3.25 29l7.15-1.88a12.6 12.6 0 0 0 5.64 1.36h.01c6.99 0 12.68-5.69 12.68-12.68S23.03 3 16.04 3Zm0 23.34h-.01c-1.8 0-3.56-.48-5.1-1.39l-.37-.22-4.24 1.11 1.13-4.13-.24-.42a10.5 10.5 0 0 1-1.6-5.62c0-5.7 4.64-10.33 10.35-10.33 2.76 0 5.36 1.08 7.31 3.03a10.28 10.28 0 0 1 3.03 7.31c0 5.7-4.64 10.34-10.26 10.34Zm5.67-7.75c-.31-.16-1.84-.91-2.12-1.01-.29-.11-.5-.16-.71.16-.21.31-.82 1.01-1 1.22-.18.21-.37.24-.68.08-.31-.16-1.31-.48-2.5-1.53-.92-.82-1.55-1.84-1.73-2.15-.18-.31-.02-.48.14-.64.14-.14.31-.37.47-.55.16-.18.21-.31.31-.52.11-.21.05-.39-.03-.55-.08-.16-.71-1.71-.97-2.34-.25-.61-.51-.53-.71-.54h-.61c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63s1.13 3.05 1.29 3.26c.16.21 2.23 3.41 5.4 4.78.75.32 1.34.52 1.8.66.76.24 1.45.21 2 .13.61-.09 1.84-.75 2.1-1.48.26-.73.26-1.35.18-1.48-.08-.13-.29-.21-.6-.37Z" />
      </svg>
    </a>
  )
}

export function CookieConsentBanner({ enabled }) {
  const [accepted, setAccepted] = useState(() => localStorage.getItem('cookie_consent') === 'true')
  const visible = enabled && !accepted

  if (!visible) return null

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-4 shadow-2xl md:flex md:items-center md:justify-between md:gap-6"
      initial={{ opacity: 0, y: 24 }}
    >
      <p className="text-sm font-semibold text-gray-700">
        আমরা আপনার অভিজ্ঞতা উন্নত করতে কুকি ব্যবহার করি।
      </p>
      <div className="mt-3 flex gap-2 md:mt-0">
        <a className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50" href="#home">
          আরও জানুন
        </a>
        <button
          className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700"
          onClick={() => {
            localStorage.setItem('cookie_consent', 'true')
            setAccepted(true)
          }}
          type="button"
        >
          সম্মতি দিন
        </button>
      </div>
    </motion.div>
  )
}

export function EventMeta({ event }) {
  const date = getEventDate(event)

  return (
    <div className="mt-4 grid gap-2 text-sm text-gray-500">
      <span className="inline-flex items-center gap-2">
        <CalendarDays aria-hidden="true" className="h-4 w-4 text-indigo-500" />
        {formatDate(date)}
      </span>
      <span className="inline-flex items-center gap-2">
        <Clock3 aria-hidden="true" className="h-4 w-4 text-indigo-500" />
        {formatTime(date)}
      </span>
    </div>
  )
}
