import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import api, { getErrorMessage } from '../api/http'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Panel from '../components/ui/Panel'
import Skeleton from '../components/ui/Skeleton'

const toDate = (value) => (value ? new Date(value).toLocaleDateString('en-GB') : 'N/A')

export default function MemberVerifyPage() {
  const { memberId } = useParams()
  const [member, setMember] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMember = async () => {
      try {
        const response = await api.get(`/members/verify/${memberId}`)
        setMember(response.data.data.member)
      } catch (requestError) {
        setError(getErrorMessage(requestError))
      } finally {
        setLoading(false)
      }
    }

    loadMember()
  }, [memberId])

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Panel>
        {loading ? <Skeleton rows={6} /> : null}
        {!loading && error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}
        {!loading && member ? (
          <div className="text-center">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <ShieldCheck aria-hidden="true" className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-gray-900">
              Verified Member
            </h1>
            <div className="mt-6 flex flex-col items-center gap-3">
              <Avatar name={member.name} size="xl" src={member.profilePhotoUrl} />
              <div>
                <p className="text-xl font-semibold text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500">ID: {member.memberId}</p>
              </div>
              <Badge value="approved">Approved</Badge>
            </div>
            <dl className="mt-6 grid gap-3 rounded-xl bg-gray-50 p-4 text-left text-sm">
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-gray-500">Role</dt>
                <dd className="font-semibold text-gray-900">{member.role}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-gray-500">Approved</dt>
                <dd className="font-semibold text-gray-900">{toDate(member.approvedAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-gray-500">Phone</dt>
                <dd className="font-semibold text-gray-900">****{member.phoneLast4}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </Panel>
    </main>
  )
}
