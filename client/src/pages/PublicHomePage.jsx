import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Heart, HeartHandshake, Image, LogIn, MessageCircle, Send, UserPlus } from 'lucide-react'
import api, { getErrorMessage } from '../api/http'
import heroImage from '../assets/community-hero.png'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Panel from '../components/ui/Panel'
import Skeleton from '../components/ui/Skeleton'
import { readFileAsDataUrl } from '../utils/fileUtils'

const initialDonationForm = {
  amount: '',
  donorName: '',
  method: '',
  note: '',
  phone: '',
  proofImageUrl: '',
  transactionId: '',
}

const money = (value = 0) => `Tk ${Number(value || 0).toLocaleString('en-US')}`

const formatDate = (value) => {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export default function PublicHomePage() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [donationForm, setDonationForm] = useState(initialDonationForm)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [data, setData] = useState({
    activities: [],
    blogs: [],
    donations: [],
    gallery: [],
    meetings: [],
    notices: [],
    rules: [],
    settings: {},
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
      ] =
        await Promise.all([
          api.get('/settings/public'),
          api.get('/notices/public'),
          api.get('/meetings/public'),
          api.get('/tours/public'),
          api.get('/activities/public'),
          api.get('/rules/public'),
          api.get('/donations/verified'),
          api.get('/blogs/public'),
          api.get('/gallery/public'),
        ])

      setData({
        activities: activitiesResponse.data.data.items,
        blogs: blogsResponse.data.data.blogs,
        donations: donationsResponse.data.data.donations,
        gallery: galleryResponse.data.data.items,
        meetings: meetingsResponse.data.data.items,
        notices: noticesResponse.data.data.items,
        rules: rulesResponse.data.data.items,
        settings: settingsResponse.data.data.settings,
        tours: toursResponse.data.data.items,
      })
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPublicData()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadPublicData])

  const handleDonationChange = (event) => {
    setDonationForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const submitDonation = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      await api.post('/donations', donationForm)
      setDonationForm(initialDonationForm)
      setMessage('Donation submitted for admin verification. Thank you.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const uploadDonationProof = async (file) => {
    if (!file) {
      return
    }

    setUploadingProof(true)
    setMessage('')

    try {
      const image = await readFileAsDataUrl(file)
      const response = await api.post('/uploads/payment-proof', {
        image,
        name: `donation-${Date.now()}`,
      })
      setDonationForm((current) => ({
        ...current,
        proofImageUrl: response.data.data.image.url,
      }))
      setMessage('Donation proof uploaded.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setUploadingProof(false)
    }
  }

  return (
    <main className="bg-slate-50 text-slate-950">
      <section
        className="relative min-h-[68vh] overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.30)), url(${heroImage})`,
        }}
      >
        <div className="mx-auto flex min-h-[68vh] max-w-7xl items-center px-4 py-14 sm:px-6">
          <div className="max-w-2xl text-white">
            <p className="text-sm font-semibold uppercase text-emerald-100">
              Village unity and service
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
              Dargah Para OIkko Porishod
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-100">
              A shared system for registration, fees, notices, meetings, activities, rules, and
              transparent community finance.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                to="/register"
              >
                <UserPlus aria-hidden="true" className="h-4 w-4" />
                Register
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                to="/login"
              >
                <LogIn aria-hidden="true" className="h-4 w-4" />
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-8">
          {message ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              {message}
            </p>
          ) : null}

          {loading ? (
            <Panel>
              <Skeleton rows={5} />
            </Panel>
          ) : null}

          {!loading ? (
            <>
              <PublicGallery items={data.gallery} />
              <PublicBlogs blogs={data.blogs} />
              <PublicList items={data.notices} textKey="body" title="Public Notices" />
              <PublicList items={data.meetings} textKey="agenda" title="Public Meetings" />
              <PublicList items={data.tours} textKey="details" title="Public Tours" />
              <PublicList
                items={data.activities}
                textKey="description"
                title="Educational Activities"
              />
              <PublicList items={data.rules} textKey="description" title="Public Rules" />
            </>
          ) : null}
        </div>

        <aside className="grid gap-6 self-start">
          <Panel>
            <HeartHandshake className="h-8 w-8 text-emerald-700" />
            <h2 className="mt-4 text-xl font-bold text-slate-950">Donate</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {data.settings.donationProvider || 'Donation number'}:{' '}
              <span className="font-semibold text-slate-950">
                {data.settings.donationNumber || 'Not set yet'}
              </span>
            </p>
            <form className="mt-5 grid gap-4" onSubmit={submitDonation}>
              <Field
                label="Name"
                name="donorName"
                onChange={handleDonationChange}
                required
                value={donationForm.donorName}
              />
              <Field
                label="Phone"
                name="phone"
                onChange={handleDonationChange}
                required
                value={donationForm.phone}
              />
              <Field
                label="Amount"
                name="amount"
                onChange={handleDonationChange}
                required
                type="number"
                value={donationForm.amount}
              />
              <Field
                label="Method"
                name="method"
                onChange={handleDonationChange}
                placeholder="bKash or Nagad"
                required
                value={donationForm.method}
              />
              <Field
                label="Transaction ID"
                name="transactionId"
                onChange={handleDonationChange}
                required
                value={donationForm.transactionId}
              />
              <Field
                label="Note"
                name="note"
                onChange={handleDonationChange}
                textarea
                value={donationForm.note}
              />
              <Field
                label="Payment Proof URL"
                name="proofImageUrl"
                onChange={handleDonationChange}
                value={donationForm.proofImageUrl}
              />
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                <span>Upload Payment Proof</span>
                <input
                  accept="image/*"
                  className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                  disabled={uploadingProof}
                  onChange={(event) => uploadDonationProof(event.target.files?.[0])}
                  type="file"
                />
              </label>
              {uploadingProof ? (
                <p className="text-sm font-medium text-emerald-700">Uploading proof...</p>
              ) : null}
              <Button icon={Send} type="submit">
                Submit Donation
              </Button>
            </form>
          </Panel>

          <Panel>
            <h2 className="text-xl font-bold text-slate-950">Registration Fee</h2>
            <p className="mt-3 text-3xl font-bold text-emerald-700">
              {money(data.settings.registrationFee)}
            </p>
            <Link
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              to="/register"
            >
              <UserPlus aria-hidden="true" className="h-4 w-4" />
              Apply for Membership
            </Link>
          </Panel>

          <Panel>
            <h2 className="text-xl font-bold text-slate-950">Verified Donations</h2>
            <div className="mt-4 grid gap-3">
              {data.donations.length === 0 ? (
                <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  No verified donations yet.
                </p>
              ) : null}
              {data.donations.slice(0, 8).map((donation) => (
                <div className="rounded-md border border-slate-200 p-3" key={donation._id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{donation.donorName}</p>
                    <p className="font-bold text-emerald-700">{money(donation.amount)}</p>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {formatDate(donation.verifiedAt || donation.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  )
}

function PublicList({ items, textKey, title }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.length === 0 ? (
          <p className="rounded-md bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            No items published yet.
          </p>
        ) : null}
        {items.map((item) => (
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={item._id}>
            {item.imageUrl ? (
              <img
                alt=""
                className="mb-4 h-40 w-full rounded-md object-cover"
                src={item.imageUrl}
              />
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-950">{item.title}</h3>
              {item.status ? <Badge value={item.status}>{item.status}</Badge> : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item[textKey]}</p>
            {item.activityDate || item.meetingDate || item.startDate ? (
              <p className="mt-3 text-xs font-semibold uppercase text-emerald-700">
                {formatDate(item.activityDate || item.meetingDate || item.startDate)}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

function PublicGallery({ items }) {
  return (
    <section>
      <div className="flex items-center gap-2">
        <Image aria-hidden="true" className="h-5 w-5 text-emerald-700" />
        <h2 className="text-xl font-bold text-slate-950">Gallery</h2>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {items.length === 0 ? (
          <p className="rounded-md bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            No gallery photos yet.
          </p>
        ) : null}
        {items.slice(0, 6).map((item) => (
          <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" key={item._id}>
            <img alt="" className="h-44 w-full object-cover" src={item.imageUrl} />
            <div className="p-4">
              <h3 className="font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              <p className="mt-3 text-xs font-semibold uppercase text-emerald-700">
                {item.createdBy?.name || 'Member'}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function PublicBlogs({ blogs }) {
  return (
    <section>
      <div className="flex items-center gap-2">
        <BookOpen aria-hidden="true" className="h-5 w-5 text-emerald-700" />
        <h2 className="text-xl font-bold text-slate-950">Community Blogs</h2>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {blogs.length === 0 ? (
          <p className="rounded-md bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            No blogs published yet.
          </p>
        ) : null}
        {blogs.slice(0, 4).map((blog) => (
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={blog._id}>
            {blog.imageUrl ? (
              <img alt="" className="mb-4 h-40 w-full rounded-md object-cover" src={blog.imageUrl} />
            ) : null}
            <h3 className="font-semibold text-slate-950">{blog.title}</h3>
            <p className="mt-1 text-xs font-semibold uppercase text-emerald-700">
              {blog.createdBy?.name || 'Member'} | {formatDate(blog.createdAt)}
            </p>
            <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{blog.body}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Heart aria-hidden="true" className="h-4 w-4 text-rose-700" />
                {blog.likes?.length || 0} likes
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle aria-hidden="true" className="h-4 w-4 text-emerald-700" />
                {blog.comments?.length || 0} comments
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
