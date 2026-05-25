import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Heart, HeartHandshake, Image, MessageCircle, Send, UserPlus, Users } from 'lucide-react'
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

  const totalDonationAmount = data.donations.reduce(
    (sum, donation) => sum + Number(donation.amount || 0),
    0,
  )

  return (
    <main className="bg-gray-50 text-gray-900">
      <section
        className="relative min-h-[72vh] overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.30)), url(${heroImage})`,
        }}
      >
        <div className="mx-auto flex min-h-[72vh] max-w-7xl items-center px-4 py-14 sm:px-6">
          <div className="max-w-2xl text-white">
            <p className="text-sm font-semibold uppercase text-indigo-100">ঐক্য, সেবা ও স্বচ্ছতা</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
              দরগাহ পাড়া ঐক্য পরিষদ
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-100">
              সদস্য নিবন্ধন, মাসিক ফি, নোটিশ, মিটিং, দান এবং গ্রামের কাজের হিসাব এক জায়গায়।
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                to="/register"
              >
                <UserPlus aria-hidden="true" className="h-4 w-4" />
                নিবন্ধন করুন
              </Link>
              <a
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
                href="#donate"
              >
                <HeartHandshake aria-hidden="true" className="h-4 w-4" />
                দান করুন
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-3">
        <Panel className="relative z-10">
          <Users className="h-6 w-6 text-indigo-600" />
          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">৬০+</p>
          <p className="text-sm text-gray-500">সক্রিয় সদস্য</p>
        </Panel>
        <Panel className="relative z-10">
          <BookOpen className="h-6 w-6 text-indigo-600" />
          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">৫+</p>
          <p className="text-sm text-gray-500">বছরের কার্যক্রম</p>
        </Panel>
        <Panel className="relative z-10">
          <HeartHandshake className="h-6 w-6 text-indigo-600" />
          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
            {money(totalDonationAmount)}
          </p>
          <p className="text-sm text-gray-500">যাচাইকৃত দান</p>
        </Panel>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-8">
          {message ? (
            <p className="rounded-md border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800">
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
              <AnnouncementCards notices={data.notices} />
              <PublicGallery items={data.gallery} />
              <PublicBlogs blogs={data.blogs} />
              <PublicList items={data.notices} textKey="body" title="নোটিশ" />
              <PublicList items={data.meetings} textKey="agenda" title="মিটিং" />
              <PublicList items={data.tours} textKey="details" title="ভ্রমণ" />
              <PublicList
                items={data.activities}
                textKey="description"
                title="শিক্ষা কার্যক্রম"
              />
              <PublicList items={data.rules} textKey="description" title="নিয়মাবলি" />
            </>
          ) : null}
        </div>

        <aside className="grid gap-6 self-start" id="donate">
          <Panel>
            <HeartHandshake className="h-8 w-8 text-indigo-700" />
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-gray-900">দান করুন</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {data.settings.donationProvider || 'দান নম্বর'}:{' '}
              <span className="font-semibold text-gray-900">
                {data.settings.donationNumber || 'এখনো সেট করা হয়নি'}
              </span>
            </p>
            <form className="mt-5 grid gap-4" onSubmit={submitDonation}>
              <Field
                label="নাম"
                name="donorName"
                onChange={handleDonationChange}
                required
                value={donationForm.donorName}
              />
              <Field
                label="ফোন"
                name="phone"
                onChange={handleDonationChange}
                required
                value={donationForm.phone}
              />
              <Field
                label="টাকার পরিমাণ"
                name="amount"
                onChange={handleDonationChange}
                required
                type="number"
                value={donationForm.amount}
              />
              <Field
                label="পেমেন্ট মাধ্যম"
                name="method"
                onChange={handleDonationChange}
                placeholder="bKash or Nagad"
                required
                value={donationForm.method}
              />
              <Field
                label="ট্রানজেকশন আইডি"
                name="transactionId"
                onChange={handleDonationChange}
                required
                value={donationForm.transactionId}
              />
              <Field
                label="নোট"
                name="note"
                onChange={handleDonationChange}
                textarea
                value={donationForm.note}
              />
              <Field
                label="পেমেন্ট প্রমাণ URL"
                name="proofImageUrl"
                onChange={handleDonationChange}
                value={donationForm.proofImageUrl}
              />
              <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                <span>পেমেন্ট প্রমাণ আপলোড</span>
                <input
                  accept="image/*"
                  className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700"
                  disabled={uploadingProof}
                  onChange={(event) => uploadDonationProof(event.target.files?.[0])}
                  type="file"
                />
              </label>
              {uploadingProof ? (
                <p className="text-sm font-medium text-indigo-700">আপলোড হচ্ছে...</p>
              ) : null}
              <Button icon={Send} type="submit">
                দান জমা দিন
              </Button>
            </form>
          </Panel>

          <Panel>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">নিবন্ধন ফি</h2>
            <p className="mt-3 text-3xl font-bold text-indigo-700">
              {money(data.settings.registrationFee)}
            </p>
            <Link
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
              to="/register"
            >
              <UserPlus aria-hidden="true" className="h-4 w-4" />
              সদস্য হতে আবেদন করুন
            </Link>
          </Panel>

          <Panel>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">যাচাইকৃত দান</h2>
            <div className="mt-4 grid gap-3">
              {data.donations.length === 0 ? (
                <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  এখনো কোনো যাচাইকৃত দান নেই।
                </p>
              ) : null}
              {data.donations.slice(0, 8).map((donation) => (
                <div className="rounded-md border border-gray-200 p-3" key={donation._id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-950">{donation.donorName}</p>
                    <p className="font-bold text-indigo-700">{money(donation.amount)}</p>
                  </div>
                  <p className="mt-1 text-xs font-medium text-gray-500">
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
      <h2 className="text-xl font-bold text-gray-950">{title}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.length === 0 ? (
          <p className="rounded-md bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
            No items published yet.
          </p>
        ) : null}
        {items.map((item) => (
          <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm" key={item._id}>
            {item.imageUrl ? (
              <img
                alt=""
                className="mb-4 h-40 w-full rounded-md object-cover"
                src={item.imageUrl}
              />
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-950">{item.title}</h3>
              {item.status ? <Badge value={item.status}>{item.status}</Badge> : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-600">{item[textKey]}</p>
            {item.activityDate || item.meetingDate || item.startDate ? (
              <p className="mt-3 text-xs font-semibold uppercase text-indigo-700">
                {formatDate(item.activityDate || item.meetingDate || item.startDate)}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

function AnnouncementCards({ notices }) {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight text-gray-900">সর্বশেষ ঘোষণা</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {notices.slice(0, 3).map((notice) => (
          <Panel className="p-5" key={notice._id}>
            <Badge value="planned">ঘোষণা</Badge>
            <h3 className="mt-3 font-semibold text-gray-900">{notice.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-500">
              {notice.body}
            </p>
          </Panel>
        ))}
      </div>
    </section>
  )
}

function PublicGallery({ items }) {
  return (
    <section>
      <div className="flex items-center gap-2">
        <Image aria-hidden="true" className="h-5 w-5 text-indigo-700" />
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">গ্যালারি</h2>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {items.length === 0 ? (
          <p className="rounded-md bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
            No gallery photos yet.
          </p>
        ) : null}
        {items.slice(0, 6).map((item) => (
          <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm" key={item._id}>
            <img alt="" className="h-44 w-full object-cover" src={item.imageUrl} />
            <div className="p-4">
              <h3 className="font-semibold text-gray-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
              <p className="mt-3 text-xs font-semibold uppercase text-indigo-700">
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
        <BookOpen aria-hidden="true" className="h-5 w-5 text-indigo-700" />
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">কমিউনিটি ব্লগ</h2>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {blogs.length === 0 ? (
          <p className="rounded-md bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
            No blogs published yet.
          </p>
        ) : null}
        {blogs.slice(0, 4).map((blog) => (
          <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm" key={blog._id}>
            {blog.imageUrl ? (
              <img alt="" className="mb-4 h-40 w-full rounded-md object-cover" src={blog.imageUrl} />
            ) : null}
            <h3 className="font-semibold text-gray-950">{blog.title}</h3>
            <p className="mt-1 text-xs font-semibold uppercase text-indigo-700">
              {blog.createdBy?.name || 'Member'} | {formatDate(blog.createdAt)}
            </p>
            <p className="mt-3 line-clamp-4 text-sm leading-6 text-gray-600">{blog.body}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-gray-600">
              <span className="inline-flex items-center gap-1">
                <Heart aria-hidden="true" className="h-4 w-4 text-red-700" />
                {blog.likes?.length || 0} likes
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle aria-hidden="true" className="h-4 w-4 text-indigo-700" />
                {blog.comments?.length || 0} comments
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
