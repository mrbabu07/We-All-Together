import { useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import {
  Check,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react'
import api, { getErrorMessage } from '../api/http'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import Modal from '../components/ui/Modal'
import Panel from '../components/ui/Panel'
import SelectField from '../components/ui/SelectField'
import Skeleton from '../components/ui/Skeleton'

const colorPresets = ['#00ADB5', '#6366F1', '#0F6E56', '#854F0B', '#993C1D', '#185FA5', '#7C3AED', '#DC2626']

const roleSchema = z.object({
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, 'Use a valid hex color.'),
  description: z.string().trim().max(300, 'Description is too long.').optional(),
  name: z.string().trim().min(1, 'Role name is required.'),
  nameEnglish: z.string().trim().optional(),
  permissions: z.array(z.string()).default([]),
})

const assignmentSchema = z.object({
  customPermissions: z.array(z.string()).default([]),
  deniedPermissions: z.array(z.string()).default([]),
  reason: z.string().trim().optional(),
  role: z.string().trim().min(1, 'Choose a role.'),
})

const bulkAssignmentSchema = z.object({
  reason: z.string().trim().optional(),
  role: z.string().trim().min(1, 'Choose a role.'),
})

const defaultRoleForm = {
  color: '#00ADB5',
  description: '',
  name: '',
  nameEnglish: '',
  permissions: [],
}

const defaultAssignmentForm = {
  customPermissions: [],
  deniedPermissions: [],
  reason: '',
  role: 'member',
}

const permissionGroupLabel = (groups, key) =>
  groups.find(([groupKey]) => groupKey === key)?.[1] || key

const permissionGroupKey = (permission) => permission.split('.')[0]

const toggleValue = (values, value) =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value]

const normalizePermissionList = (values = []) => [...new Set(values.filter(Boolean))]

const effectivePermissionsFor = (role, customPermissions = [], deniedPermissions = []) => {
  if (!role) {
    return normalizePermissionList(customPermissions)
  }

  if (role.permissions?.includes('*')) {
    return ['*']
  }

  const denied = new Set(deniedPermissions)
  return normalizePermissionList([...(role.permissions || []), ...customPermissions]).filter(
    (permission) => !denied.has(permission),
  )
}

export default function RolesPage() {
  const [roles, setRoles] = useState([])
  const [members, setMembers] = useState([])
  const [allPermissions, setAllPermissions] = useState({})
  const [permissionGroups, setPermissionGroups] = useState([])
  const [settingsPermissions, setSettingsPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [roleModal, setRoleModal] = useState(null)
  const [deleteRole, setDeleteRole] = useState(null)
  const [reassignTo, setReassignTo] = useState('member')
  const [selectedMember, setSelectedMember] = useState(null)
  const [selectedMemberIds, setSelectedMemberIds] = useState([])
  const [memberQuery, setMemberQuery] = useState('')

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm({
    defaultValues: defaultRoleForm,
    resolver: zodResolver(roleSchema),
  })
  const selectedPermissions = useWatch({ control, name: 'permissions' }) || []

  const {
    control: assignmentControl,
    formState: { errors: assignmentErrors, isSubmitting: isAssigning },
    handleSubmit: handleAssignmentSubmit,
    register: registerAssignment,
    reset: resetAssignment,
    setValue: setAssignmentValue,
  } = useForm({
    defaultValues: defaultAssignmentForm,
    resolver: zodResolver(assignmentSchema),
  })
  const assignmentValues = useWatch({ control: assignmentControl }) || defaultAssignmentForm

  const {
    formState: { errors: bulkErrors, isSubmitting: isBulkAssigning },
    handleSubmit: handleBulkSubmit,
    register: registerBulk,
    reset: resetBulk,
  } = useForm({
    defaultValues: { reason: '', role: '' },
    resolver: zodResolver(bulkAssignmentSchema),
  })

  const permissionEntries = useMemo(
    () =>
      Object.entries(allPermissions).filter(
        ([permission]) => permission !== '*' && !settingsPermissions.includes(permission),
      ),
    [allPermissions, settingsPermissions],
  )

  const groupedPermissions = useMemo(() => {
    const groups = new Map()

    permissionEntries.forEach(([permission, label]) => {
      const key = permissionGroupKey(permission)
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key).push([permission, label])
    })

    return Array.from(groups.entries())
  }, [permissionEntries])

  const selectedRole = roles.find((role) => role.name === assignmentValues.role)
  const rolePermissions = selectedRole?.permissions?.includes('*') ? permissionEntries.map(([key]) => key) : selectedRole?.permissions || []
  const extraPermissionOptions = permissionEntries.filter(
    ([permission]) => !rolePermissions.includes(permission),
  )
  const deniedPermissionOptions = permissionEntries.filter(([permission]) =>
    rolePermissions.includes(permission),
  )
  const assignmentEffectivePermissions = effectivePermissionsFor(
    selectedRole,
    assignmentValues.customPermissions,
    assignmentValues.deniedPermissions,
  )

  const filteredMembers = useMemo(() => {
    const query = memberQuery.trim().toLowerCase()

    return members.filter((member) => {
      if (!query) {
        return true
      }

      return [member.name, member.phone, member.email, member.role].filter(Boolean).some((value) =>
        String(value).toLowerCase().includes(query),
      )
    })
  }, [memberQuery, members])

  const loadData = useCallback(async () => {
    setLoading(true)
    setMessage('')

    try {
      const [rolesResponse, membersResponse] = await Promise.all([
        api.get('/admin/roles'),
        api.get('/admin/members/users'),
      ])

      setRoles(rolesResponse.data.data.roles || [])
      setAllPermissions(rolesResponse.data.data.allPermissions || {})
      setPermissionGroups(rolesResponse.data.data.permissionGroups || [])
      setSettingsPermissions(rolesResponse.data.data.settingsPermissions || [])
      setMembers(membersResponse.data.data.users || [])
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const openCreateModal = () => {
    reset(defaultRoleForm)
    setRoleModal({ mode: 'create', role: null })
  }

  const openEditModal = (role) => {
    reset({
      color: role.color || '#00ADB5',
      description: role.description || '',
      name: role.name || '',
      nameEnglish: role.nameEnglish || '',
      permissions: role.permissions?.includes('*') ? [] : role.permissions || [],
    })
    setRoleModal({ mode: 'edit', role })
  }

  const closeRoleModal = () => {
    reset(defaultRoleForm)
    setRoleModal(null)
  }

  const togglePermission = (permission) => {
    setValue('permissions', toggleValue(selectedPermissions, permission), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const setGroupPermissions = (permissions, checked) => {
    const next = checked
      ? normalizePermissionList([...selectedPermissions, ...permissions])
      : selectedPermissions.filter((permission) => !permissions.includes(permission))

    setValue('permissions', next, { shouldDirty: true, shouldValidate: true })
  }

  const saveRole = async (values) => {
    const payload = {
      ...values,
      permissions: normalizePermissionList(values.permissions),
    }

    if (roleModal?.mode === 'edit') {
      await api.put(`/admin/roles/${roleModal.role._id}`, payload)
      setMessage('ভূমিকা আপডেট হয়েছে।')
    } else {
      await api.post('/admin/roles', payload)
      setMessage('নতুন ভূমিকা তৈরি হয়েছে।')
    }

    closeRoleModal()
    await loadData()
  }

  const confirmDeleteRole = async () => {
    if (!deleteRole) {
      return
    }

    await api.delete(`/admin/roles/${deleteRole._id}`, { data: { reassignTo } })
    setMessage('ভূমিকা মুছে ফেলা হয়েছে।')
    setDeleteRole(null)
    await loadData()
  }

  const openAssignModal = (member) => {
    setSelectedMember(member)
    resetAssignment({
      customPermissions: member.customPermissions || [],
      deniedPermissions: member.deniedPermissions || [],
      reason: '',
      role: member.role || 'member',
    })
  }

  const saveAssignment = async (values) => {
    if (!selectedMember) {
      return
    }

    await api.put(`/admin/members/${selectedMember._id}/role`, {
      reason: values.reason,
      role: values.role,
    })
    await api.put(`/admin/members/${selectedMember._id}/permissions`, {
      customPermissions: normalizePermissionList(values.customPermissions),
      deniedPermissions: normalizePermissionList(values.deniedPermissions),
      reason: values.reason,
    })
    setMessage('সদস্যের ভূমিকা আপডেট হয়েছে।')
    setSelectedMember(null)
    await loadData()
  }

  const bulkAssign = async (values) => {
    await Promise.all(
      selectedMemberIds.map((memberId) =>
        api.put(`/admin/members/${memberId}/role`, {
          reason: values.reason,
          role: values.role,
        }),
      ),
    )
    setSelectedMemberIds([])
    resetBulk({ reason: '', role: '' })
    setMessage('নির্বাচিত সদস্যদের ভূমিকা আপডেট হয়েছে।')
    await loadData()
  }

  const toggleMemberSelection = (memberId) => {
    setSelectedMemberIds((current) => toggleValue(current, memberId))
  }

  if (loading) {
    return (
      <main className="grid gap-6">
        <Skeleton rows={6} />
      </main>
    )
  }

  return (
    <main className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            ভূমিকা ও অনুমতি ব্যবস্থাপনা
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            কাস্টম স্টাফ ভূমিকা, granular permission এবং সদস্য assignment পরিচালনা করুন।
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={RefreshCw} onClick={loadData} variant="secondary">
            রিফ্রেশ
          </Button>
          <Button icon={Plus} onClick={openCreateModal}>
            নতুন ভূমিকা তৈরি করুন
          </Button>
        </div>
      </div>

      {message ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--brand-200)] bg-[var(--brand-50)] px-4 py-3 text-sm font-semibold text-[var(--brand-700)]">
          {message}
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => (
          <Panel className="grid gap-4" key={role._id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: role.color || '#00ADB5' }}
                  />
                  <h2 className="truncate text-lg font-semibold text-[var(--text-primary)]">
                    {role.name}
                  </h2>
                </div>
                {role.nameEnglish ? (
                  <p className="mt-1 text-sm font-medium text-[var(--text-muted)]">
                    {role.nameEnglish}
                  </p>
                ) : null}
              </div>
              {role.isSystem ? <Badge value="approved">সিস্টেম</Badge> : null}
            </div>
            <p className="min-h-10 text-sm text-[var(--text-muted)]">
              {role.description || 'এই ভূমিকায় নির্দিষ্ট অনুমতির সেট সংরক্ষিত আছে।'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge value="approved">{role.permissions?.includes('*') ? 'সব অনুমতি' : `${role.permissions?.length || 0}টি অনুমতি`}</Badge>
              <Badge value="pending">{role.memberCount || 0} জন সদস্য</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={role.isSystem && role.name !== 'member'}
                icon={Pencil}
                onClick={() => openEditModal(role)}
                size="sm"
                variant="secondary"
              >
                Edit
              </Button>
              <Button
                disabled={role.isSystem || role.isDefault}
                icon={Trash2}
                onClick={() => {
                  setDeleteRole(role)
                  setReassignTo('member')
                }}
                size="sm"
                variant="danger"
              >
                Delete
              </Button>
            </div>
          </Panel>
        ))}
      </section>

      <Panel>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
              <Users aria-hidden="true" className="h-5 w-5" />
              সদস্যদের ভূমিকা
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              সদস্য নির্বাচন করে একক বা bulk role assignment করুন।
            </p>
          </div>
          <Field
            className="min-w-64"
            label="Search"
            name="memberSearch"
            onChange={(event) => setMemberQuery(event.target.value)}
            placeholder="নাম, ফোন, role"
            value={memberQuery}
          />
        </div>

        <form className="mt-4 grid gap-3 rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-[var(--surface-1)] p-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleBulkSubmit(bulkAssign)}>
          <SelectField error={bulkErrors.role?.message} label="Bulk role" {...registerBulk('role')}>
            <option value="">Role নির্বাচন করুন</option>
            {roles.map((role) => (
              <option key={role._id} value={role.name}>
                {role.name} {role.nameEnglish ? `(${role.nameEnglish})` : ''}
              </option>
            ))}
          </SelectField>
          <Field
            error={bulkErrors.reason?.message}
            label="কারণ"
            placeholder="ঐচ্ছিক কারণ"
            {...registerBulk('reason')}
          />
          <div className="flex items-end">
            <Button disabled={selectedMemberIds.length === 0} icon={UserCog} loading={isBulkAssigning} type="submit">
              {selectedMemberIds.length || 0} জনকে দিন
            </Button>
          </div>
        </form>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--gray-200)] text-[var(--text-muted)]">
                <th className="w-12 py-3 pr-4">
                  <span className="sr-only">Select</span>
                </th>
                <th className="py-3 pr-4">সদস্য</th>
                <th className="py-3 pr-4">বর্তমান ভূমিকা</th>
                <th className="py-3 pr-4">অতিরিক্ত অনুমতি</th>
                <th className="py-3 pr-4">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const memberRole = roles.find((role) => role.name === member.role)

                return (
                  <tr className="border-b border-[var(--gray-100)]" key={member._id}>
                    <td className="py-3 pr-4">
                      <input
                        aria-label={`Select ${member.name}`}
                        checked={selectedMemberIds.includes(member._id)}
                        className="h-4 w-4 accent-[var(--brand-600)]"
                        onChange={() => toggleMemberSelection(member._id)}
                        type="checkbox"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} size="sm" src={member.profilePhotoUrl} />
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{member.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{member.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)]">
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: memberRole?.color || '#00ADB5' }}
                        />
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[var(--text-muted)]">
                      {(member.customPermissions?.length || 0) + (member.deniedPermissions?.length || 0)}
                    </td>
                    <td className="py-3 pr-4">
                      <Button icon={UserCog} onClick={() => openAssignModal(member)} size="sm" variant="secondary">
                        ভূমিকা পরিবর্তন
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal
        className="max-w-6xl"
        onClose={closeRoleModal}
        open={Boolean(roleModal)}
        title={roleModal?.mode === 'edit' ? 'ভূমিকা সম্পাদনা' : 'নতুন ভূমিকা তৈরি করুন'}
      >
        <form className="grid gap-6 lg:grid-cols-[1fr_320px]" onSubmit={handleSubmit(saveRole)}>
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field error={errors.name?.message} label="Role name" required {...register('name')} />
              <Field error={errors.nameEnglish?.message} label="English name" {...register('nameEnglish')} />
              <Field
                className="md:col-span-2"
                error={errors.description?.message}
                label="Description"
                textarea
                {...register('description')}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Badge color</p>
              <div className="flex flex-wrap gap-2">
                {colorPresets.map((color) => (
                  <button
                    aria-label={`Use ${color}`}
                    className="h-9 w-9 rounded-[var(--radius-md)] border border-[var(--gray-200)]"
                    key={color}
                    onClick={() => setValue('color', color, { shouldDirty: true, shouldValidate: true })}
                    style={{ backgroundColor: color }}
                    type="button"
                  />
                ))}
              </div>
              <Field className="mt-3 max-w-48" error={errors.color?.message} label="Custom hex" {...register('color')} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {selectedPermissions.length} টি অনুমতি নির্বাচিত
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    setValue(
                      'permissions',
                      permissionEntries.map(([permission]) => permission),
                      { shouldDirty: true, shouldValidate: true },
                    )
                  }
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Select all
                </Button>
                <Button
                  onClick={() => setValue('permissions', [], { shouldDirty: true, shouldValidate: true })}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Deselect all
                </Button>
              </div>
            </div>
            <div className="grid gap-3">
              {groupedPermissions.map(([groupKey, permissions]) => {
                const groupPermissionKeys = permissions.map(([permission]) => permission)
                const checkedCount = groupPermissionKeys.filter((permission) =>
                  selectedPermissions.includes(permission),
                ).length

                return (
                  <details className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] p-4" key={groupKey} open>
                    <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">
                      {permissionGroupLabel(permissionGroups, groupKey)} ({checkedCount}/{groupPermissionKeys.length})
                    </summary>
                    <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)]">
                      <input
                        checked={checkedCount === groupPermissionKeys.length}
                        className="h-4 w-4 accent-[var(--brand-600)]"
                        onChange={(event) => setGroupPermissions(groupPermissionKeys, event.target.checked)}
                        type="checkbox"
                      />
                      এই গ্রুপের সব অনুমতি
                    </label>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {permissions.map(([permission, label]) => (
                        <label
                          className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--surface-1)] p-3 text-sm"
                          key={permission}
                          title={`${permission} permission`}
                        >
                          <input
                            checked={selectedPermissions.includes(permission)}
                            className="mt-0.5 h-4 w-4 accent-[var(--brand-600)]"
                            onChange={() => togglePermission(permission)}
                            type="checkbox"
                          />
                          <span>
                            <span className="block font-semibold text-[var(--text-primary)]">{label}</span>
                            <span className="text-xs text-[var(--text-muted)]">{permission}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </details>
                )
              })}
            </div>
          </div>
          <aside className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-[var(--surface-1)] p-4">
            <h3 className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
              Preview
            </h3>
            <div className="mt-4 grid gap-2 text-sm text-[var(--text-muted)]">
              {selectedPermissions.length === 0 ? (
                <p>কোনো admin feature সক্রিয় নয়।</p>
              ) : (
                selectedPermissions.slice(0, 16).map((permission) => (
                  <p className="flex items-start gap-2" key={permission}>
                    <Check aria-hidden="true" className="mt-0.5 h-4 w-4 text-[var(--success)]" />
                    {allPermissions[permission] || permission}
                  </p>
                ))
              )}
              {selectedPermissions.length > 16 ? (
                <p className="font-semibold text-[var(--text-primary)]">
                  আরও {selectedPermissions.length - 16}টি অনুমতি
                </p>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={closeRoleModal} type="button" variant="secondary">
                Cancel
              </Button>
              <Button icon={ShieldCheck} loading={isSubmitting} type="submit">
                Save
              </Button>
            </div>
          </aside>
        </form>
      </Modal>

      <Modal
        onClose={() => setDeleteRole(null)}
        open={Boolean(deleteRole)}
        title="ভূমিকা মুছে ফেলবেন?"
      >
        {deleteRole ? (
          <div className="grid gap-4">
            <p className="text-sm text-[var(--text-muted)]">
              এই ভূমিকায় {deleteRole.memberCount || 0} জন সদস্য আছেন। মুছে ফেলার আগে তাদের অন্য ভূমিকায় নেওয়া হবে।
            </p>
            <SelectField
              label="Reassign members to"
              name="reassignTo"
              onChange={(event) => setReassignTo(event.target.value)}
              value={reassignTo}
            >
              {roles
                .filter((role) => role._id !== deleteRole._id)
                .map((role) => (
                  <option key={role._id} value={role.name}>
                    {role.name}
                  </option>
                ))}
            </SelectField>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setDeleteRole(null)} variant="secondary">
                Cancel
              </Button>
              <Button icon={Trash2} onClick={confirmDeleteRole} variant="danger">
                Confirm delete
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        className="max-w-5xl"
        onClose={() => setSelectedMember(null)}
        open={Boolean(selectedMember)}
        title="ভূমিকা পরিবর্তন"
      >
        {selectedMember ? (
          <form className="grid gap-6 lg:grid-cols-[1fr_320px]" onSubmit={handleAssignmentSubmit(saveAssignment)}>
            <div className="grid gap-5">
              <div className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--surface-1)] p-4">
                <Avatar name={selectedMember.name} src={selectedMember.profilePhotoUrl} />
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{selectedMember.name}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    বর্তমান ভূমিকা: {selectedMember.role}
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Role selector</p>
                <div className="grid gap-2">
                  {roles.map((role) => (
                    <label
                      className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--gray-200)] p-3"
                      key={role._id}
                    >
                      <input
                        className="mt-1 h-4 w-4 accent-[var(--brand-600)]"
                        type="radio"
                        value={role.name}
                        {...registerAssignment('role')}
                      />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                          <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: role.color || '#00ADB5' }}
                          />
                          {role.name}
                        </span>
                        <span className="block text-xs text-[var(--text-muted)]">
                          {role.description || role.nameEnglish || 'Custom role'}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                {assignmentErrors.role?.message ? (
                  <p className="mt-2 text-xs font-semibold text-[var(--danger)]">
                    {assignmentErrors.role.message}
                  </p>
                ) : null}
              </div>
              <details className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] p-4" open>
                <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">
                  Advanced permissions
                </summary>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <PermissionChecklist
                    allPermissions={allPermissions}
                    label="অতিরিক্ত অনুমতি"
                    name="customPermissions"
                    options={extraPermissionOptions}
                    selected={assignmentValues.customPermissions || []}
                    setValue={setAssignmentValue}
                  />
                  <PermissionChecklist
                    allPermissions={allPermissions}
                    label="বাতিল অনুমতি"
                    name="deniedPermissions"
                    options={deniedPermissionOptions}
                    selected={assignmentValues.deniedPermissions || []}
                    setValue={setAssignmentValue}
                  />
                </div>
              </details>
              <Field
                error={assignmentErrors.reason?.message}
                label="পরিবর্তনের কারণ"
                placeholder="যেমন: নোটিশ বিভাগের দায়িত্ব দেওয়া হলো"
                {...registerAssignment('reason')}
              />
            </div>
            <aside className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-[var(--surface-1)] p-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Effective permissions</h3>
              <div className="mt-3 max-h-80 overflow-y-auto text-sm text-[var(--text-muted)]">
                {assignmentEffectivePermissions.includes('*') ? (
                  <p>সব অনুমতি</p>
                ) : assignmentEffectivePermissions.length ? (
                  assignmentEffectivePermissions.map((permission) => (
                    <p className="py-1" key={permission}>
                      {allPermissions[permission] || permission}
                    </p>
                  ))
                ) : (
                  <p>কোনো অনুমতি নেই।</p>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button onClick={() => setSelectedMember(null)} type="button" variant="secondary">
                  Cancel
                </Button>
                <Button icon={UserCog} loading={isAssigning} type="submit">
                  Save
                </Button>
              </div>
            </aside>
          </form>
        ) : null}
      </Modal>
    </main>
  )
}

function PermissionChecklist({ allPermissions, label, name, options, selected, setValue }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">{label}</p>
      <div className="max-h-72 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--gray-200)]">
        {options.length === 0 ? (
          <p className="p-3 text-sm text-[var(--text-muted)]">কোনো permission নেই।</p>
        ) : null}
        {options.map(([permission]) => (
          <label className="flex items-start gap-2 border-b border-[var(--gray-100)] p-3 text-sm" key={permission}>
            <input
              checked={selected.includes(permission)}
              className="mt-0.5 h-4 w-4 accent-[var(--brand-600)]"
              onChange={() =>
                setValue(name, toggleValue(selected, permission), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              type="checkbox"
            />
            <span>
              <span className="block font-medium text-[var(--text-primary)]">
                {allPermissions[permission] || permission}
              </span>
              <span className="text-xs text-[var(--text-muted)]">{permission}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
