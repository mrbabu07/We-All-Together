const mongoose = require('mongoose')
const connectDB = require('../src/config/db')
const { AUDIENCES, ITEM_STATUSES } = require('../src/constants/contentConstants')
const { PAYMENT_STATUSES, PAYMENT_TYPES } = require('../src/constants/paymentConstants')
const { USER_ROLES, USER_STATUSES } = require('../src/constants/userConstants')
const Activity = require('../src/models/Activity')
const AuditLog = require('../src/models/AuditLog')
const Blog = require('../src/models/Blog')
const Donation = require('../src/models/Donation')
const Expense = require('../src/models/Expense')
const GalleryItem = require('../src/models/GalleryItem')
const Meeting = require('../src/models/Meeting')
const Notice = require('../src/models/Notice')
const Notification = require('../src/models/Notification')
const OrganizationSetting = require('../src/models/OrganizationSetting')
const Payment = require('../src/models/Payment')
const Rule = require('../src/models/Rule')
const Tour = require('../src/models/Tour')
const User = require('../src/models/User')

const demoPassword = process.env.SEED_USER_PASSWORD || 'Member@123'
const demoAdminPassword = process.env.SEED_ADMIN_PASSWORD || 'DemoAdmin@123'
const adminPhone = process.env.SEED_ADMIN_PHONE || '01700000000'

const image = (seed) => `https://picsum.photos/seed/dargah-${seed}/900/520`
const avatar = (seed) => `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`

const dateFromNow = (days) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

const monthFromNow = (offset) => {
  const date = new Date()
  date.setMonth(date.getMonth() + offset)
  return date.toISOString().slice(0, 7)
}

const samplePhones = [
  '01710000001',
  '01710000002',
  '01710000003',
  '01710000004',
  '01710000005',
  '01710000006',
  '01710000007',
  '01710000008',
  '01710000009',
]

const contentTitles = {
  activities: [
    'Seed: SSC scholarship coaching',
    'Seed: Clean village campaign',
    'Seed: Computer literacy evening',
  ],
  blogs: [
    'Seed: Why monthly transparency matters',
    'Seed: A member story from the coaching program',
    'Seed: Preparing for the Sylhet tour',
  ],
  gallery: [
    'Seed: Community meeting photo',
    'Seed: Student support materials',
    'Seed: Clean village campaign photo',
    'Seed: Donation handover moment',
  ],
  meetings: [
    'Seed: Weekly finance review',
    'Seed: Eid program planning',
    'Seed: Member rules workshop',
  ],
  notices: [
    'Seed: Registration booth open',
    'Seed: Monthly fee collection reminder',
    'Seed: Member-only finance update',
  ],
  rules: [
    'Seed: Monthly fee deadline',
    'Seed: Meeting attendance',
    'Seed: Donation verification',
  ],
  tours: [
    'Seed: Sylhet community tour',
    'Seed: Historical mosque visit',
  ],
}

const removePreviousSeedData = async () => {
  const sampleUsers = await User.find({ phone: { $in: samplePhones } }).select('_id')
  const sampleUserIds = sampleUsers.map((user) => user._id)

  await Promise.all([
    Activity.deleteMany({ title: { $in: contentTitles.activities } }),
    AuditLog.deleteMany({ action: /^seed\./ }),
    Blog.deleteMany({ title: { $in: contentTitles.blogs } }),
    Donation.deleteMany({ transactionId: /^SEED-DON-/ }),
    Expense.deleteMany({ title: /^Seed:/ }),
    GalleryItem.deleteMany({ title: { $in: contentTitles.gallery } }),
    Meeting.deleteMany({ title: { $in: contentTitles.meetings } }),
    Notice.deleteMany({ title: { $in: contentTitles.notices } }),
    Notification.deleteMany({
      $or: [{ user: { $in: sampleUserIds } }, { title: /^Seed:/ }],
    }),
    Payment.deleteMany({ transactionId: /^SEED-PAY-/ }),
    Rule.deleteMany({ title: { $in: contentTitles.rules } }),
    Tour.deleteMany({ title: { $in: contentTitles.tours } }),
  ])

  await User.deleteMany({ phone: { $in: samplePhones } })
}

const findOrCreateAdmin = async () => {
  let admin =
    (await User.findOne({ phone: adminPhone, role: USER_ROLES.ADMIN })) ||
    (await User.findOne({ role: USER_ROLES.ADMIN }))

  if (admin) {
    return admin
  }

  admin = await User.create({
    address: 'Dargah Para central office',
    approvedAt: new Date(),
    name: 'Demo Admin',
    password: demoAdminPassword,
    phone: adminPhone,
    role: USER_ROLES.ADMIN,
    status: USER_STATUSES.APPROVED,
  })

  return admin
}

const seedSettings = async () => {
  await OrganizationSetting.findOneAndUpdate(
    { key: 'default' },
    {
      donationNumber: '01712345678',
      donationProvider: 'bKash / Nagad',
      monthlyFee: 150,
      registrationFee: 500,
    },
    { returnDocument: 'after', setDefaultsOnInsert: true, upsert: true },
  )
}

const seedUsers = async (admin) => {
  const approvedMembers = await User.create([
    {
      address: 'North lane, Dargah Para',
      approvedAt: dateFromNow(-120),
      approvedBy: admin._id,
      birthCertificateUrl: image('birth-rahim'),
      name: 'Rahim Uddin',
      nidImageUrl: image('nid-rahim'),
      password: demoPassword,
      phone: '01710000001',
      profilePhotoUrl: avatar('Rahim Uddin'),
      registrationPayment: {
        amount: 500,
        method: 'bKash',
        paidAt: dateFromNow(-121),
        senderPhone: '01720000001',
        status: PAYMENT_STATUSES.VERIFIED,
        transactionId: 'SEED-REG-001',
        verifiedAt: dateFromNow(-120),
        verifiedBy: admin._id,
      },
      role: USER_ROLES.MEMBER,
      status: USER_STATUSES.APPROVED,
    },
    {
      address: 'School road, Dargah Para',
      approvedAt: dateFromNow(-95),
      approvedBy: admin._id,
      name: 'Karim Ahmed',
      password: demoPassword,
      phone: '01710000002',
      profilePhotoUrl: avatar('Karim Ahmed'),
      registrationPayment: {
        amount: 500,
        method: 'Nagad',
        paidAt: dateFromNow(-96),
        senderPhone: '01720000002',
        status: PAYMENT_STATUSES.VERIFIED,
        transactionId: 'SEED-REG-002',
        verifiedAt: dateFromNow(-95),
        verifiedBy: admin._id,
      },
      role: USER_ROLES.MEMBER,
      status: USER_STATUSES.APPROVED,
    },
    {
      address: 'Bazar para, Dargah Para',
      approvedAt: dateFromNow(-70),
      approvedBy: admin._id,
      name: 'Mizanur Rahman',
      password: demoPassword,
      phone: '01710000003',
      profilePhotoUrl: avatar('Mizanur Rahman'),
      registrationPayment: {
        amount: 500,
        method: 'bKash',
        paidAt: dateFromNow(-71),
        senderPhone: '01720000003',
        status: PAYMENT_STATUSES.VERIFIED,
        transactionId: 'SEED-REG-003',
        verifiedAt: dateFromNow(-70),
        verifiedBy: admin._id,
      },
      role: USER_ROLES.MEMBER,
      status: USER_STATUSES.APPROVED,
    },
    {
      address: 'East field, Dargah Para',
      approvedAt: dateFromNow(-42),
      approvedBy: admin._id,
      name: 'Sabbir Hossain',
      password: demoPassword,
      phone: '01710000004',
      profilePhotoUrl: avatar('Sabbir Hossain'),
      registrationPayment: {
        amount: 500,
        method: 'Rocket',
        paidAt: dateFromNow(-43),
        senderPhone: '01720000004',
        status: PAYMENT_STATUSES.VERIFIED,
        transactionId: 'SEED-REG-004',
        verifiedAt: dateFromNow(-42),
        verifiedBy: admin._id,
      },
      role: USER_ROLES.MEMBER,
      status: USER_STATUSES.APPROVED,
    },
    {
      address: 'Mosque road, Dargah Para',
      approvedAt: dateFromNow(-18),
      approvedBy: admin._id,
      name: 'Jahid Hasan',
      password: demoPassword,
      phone: '01710000005',
      profilePhotoUrl: avatar('Jahid Hasan'),
      registrationPayment: {
        amount: 500,
        method: 'bKash',
        paidAt: dateFromNow(-19),
        senderPhone: '01720000005',
        status: PAYMENT_STATUSES.VERIFIED,
        transactionId: 'SEED-REG-005',
        verifiedAt: dateFromNow(-18),
        verifiedBy: admin._id,
      },
      role: USER_ROLES.MEMBER,
      status: USER_STATUSES.APPROVED,
    },
    {
      address: 'West lane, Dargah Para',
      approvedAt: dateFromNow(-10),
      approvedBy: admin._id,
      name: 'Tanvir Islam',
      password: demoPassword,
      phone: '01710000006',
      profilePhotoUrl: avatar('Tanvir Islam'),
      registrationPayment: {
        amount: 500,
        method: 'Nagad',
        paidAt: dateFromNow(-11),
        senderPhone: '01720000006',
        status: PAYMENT_STATUSES.VERIFIED,
        transactionId: 'SEED-REG-006',
        verifiedAt: dateFromNow(-10),
        verifiedBy: admin._id,
      },
      role: USER_ROLES.MEMBER,
      status: USER_STATUSES.APPROVED,
    },
  ])

  await User.create([
    {
      address: 'Pending road, Dargah Para',
      name: 'Rashed Pending',
      password: demoPassword,
      phone: '01710000007',
      registrationPayment: {
        amount: 500,
        method: 'bKash',
        paidAt: dateFromNow(-2),
        proofImageUrl: image('pending-proof-1'),
        senderPhone: '01720000007',
        status: PAYMENT_STATUSES.PENDING,
        transactionId: 'SEED-REG-007',
      },
      role: USER_ROLES.MEMBER,
      status: USER_STATUSES.PENDING,
    },
    {
      address: 'New market lane, Dargah Para',
      name: 'Nasim Pending',
      password: demoPassword,
      phone: '01710000008',
      registrationPayment: {
        amount: 500,
        method: 'Nagad',
        paidAt: dateFromNow(-1),
        proofImageUrl: image('pending-proof-2'),
        senderPhone: '01720000008',
        status: PAYMENT_STATUSES.PENDING,
        transactionId: 'SEED-REG-008',
      },
      role: USER_ROLES.MEMBER,
      status: USER_STATUSES.PENDING,
    },
    {
      address: 'Old bridge, Dargah Para',
      name: 'Rejected Applicant',
      password: demoPassword,
      phone: '01710000009',
      registrationPayment: {
        amount: 500,
        method: 'bKash',
        note: 'Sample rejected registration',
        paidAt: dateFromNow(-12),
        senderPhone: '01720000009',
        status: PAYMENT_STATUSES.REJECTED,
        transactionId: 'SEED-REG-009',
      },
      rejectedAt: dateFromNow(-11),
      rejectedBy: admin._id,
      role: USER_ROLES.MEMBER,
      status: USER_STATUSES.REJECTED,
    },
  ])

  return approvedMembers
}

const seedFinance = async (admin, members) => {
  const currentMonth = monthFromNow(0)
  const previousMonth = monthFromNow(-1)
  const twoMonthsAgo = monthFromNow(-2)

  await Payment.create([
    ...members.slice(0, 5).map((member, index) => ({
      amount: 150,
      method: index % 2 === 0 ? 'bKash' : 'Nagad',
      month: currentMonth,
      note: 'Seed current month fee',
      proofImageUrl: image(`payment-current-${index}`),
      senderPhone: `0173000000${index + 1}`,
      status: PAYMENT_STATUSES.VERIFIED,
      transactionId: `SEED-PAY-CURRENT-${index + 1}`,
      type: PAYMENT_TYPES.MONTHLY_FEE,
      user: member._id,
      verifiedAt: dateFromNow(-index - 1),
      verifiedBy: admin._id,
    })),
    {
      amount: 150,
      method: 'bKash',
      month: currentMonth,
      note: 'Waiting for admin verification',
      proofImageUrl: image('payment-pending'),
      senderPhone: '01730000006',
      status: PAYMENT_STATUSES.PENDING,
      transactionId: 'SEED-PAY-CURRENT-6',
      type: PAYMENT_TYPES.MONTHLY_FEE,
      user: members[5]._id,
    },
    ...members.slice(0, 4).map((member, index) => ({
      amount: 150,
      method: index % 2 === 0 ? 'Nagad' : 'bKash',
      month: previousMonth,
      note: 'Seed previous month fee',
      proofImageUrl: image(`payment-previous-${index}`),
      senderPhone: `0173100000${index + 1}`,
      status: PAYMENT_STATUSES.VERIFIED,
      transactionId: `SEED-PAY-PREV-${index + 1}`,
      type: PAYMENT_TYPES.MONTHLY_FEE,
      user: member._id,
      verifiedAt: dateFromNow(-30 - index),
      verifiedBy: admin._id,
    })),
    {
      amount: 150,
      method: 'Rocket',
      month: twoMonthsAgo,
      note: 'Rejected sample payment',
      proofImageUrl: image('payment-rejected'),
      senderPhone: '01732000001',
      status: PAYMENT_STATUSES.REJECTED,
      transactionId: 'SEED-PAY-REJECTED-1',
      type: PAYMENT_TYPES.MONTHLY_FEE,
      user: members[4]._id,
    },
  ])

  await Donation.create([
    {
      amount: 5000,
      donorName: 'Haji Abdul Mannan',
      method: 'bKash',
      note: 'For education support',
      phone: '01840000001',
      proofImageUrl: image('donation-1'),
      status: PAYMENT_STATUSES.VERIFIED,
      transactionId: 'SEED-DON-001',
      verifiedAt: dateFromNow(-9),
      verifiedBy: admin._id,
    },
    {
      amount: 2500,
      donorName: 'Local Business Group',
      method: 'Nagad',
      note: 'Community fund',
      phone: '01840000002',
      proofImageUrl: image('donation-2'),
      status: PAYMENT_STATUSES.VERIFIED,
      transactionId: 'SEED-DON-002',
      verifiedAt: dateFromNow(-6),
      verifiedBy: admin._id,
    },
    {
      amount: 1200,
      donorName: 'Anonymous Donor',
      method: 'bKash',
      note: 'Pending sample donation',
      phone: '01840000003',
      proofImageUrl: image('donation-3'),
      status: PAYMENT_STATUSES.PENDING,
      transactionId: 'SEED-DON-003',
    },
    {
      amount: 700,
      donorName: 'Rejected Donor Sample',
      method: 'Nagad',
      note: 'Rejected sample donation',
      phone: '01840000004',
      status: PAYMENT_STATUSES.REJECTED,
      transactionId: 'SEED-DON-004',
    },
  ])

  await Expense.create([
    {
      amount: 1800,
      category: 'Meeting',
      createdBy: admin._id,
      date: dateFromNow(-20),
      note: 'Tea, snacks, and chairs',
      title: 'Seed: Weekly meeting arrangement',
    },
    {
      amount: 3200,
      category: 'Education',
      createdBy: admin._id,
      date: dateFromNow(-15),
      note: 'Books and notebooks for students',
      title: 'Seed: Student materials',
    },
    {
      amount: 950,
      category: 'Maintenance',
      createdBy: admin._id,
      date: dateFromNow(-8),
      note: 'Notice board repair',
      title: 'Seed: Notice board repair',
    },
    {
      amount: 1400,
      category: 'Relief',
      createdBy: admin._id,
      date: dateFromNow(-3),
      note: 'Emergency family support',
      title: 'Seed: Emergency support',
    },
  ])
}

const seedContent = async (admin, members) => {
  await Notice.create([
    {
      audience: AUDIENCES.PUBLIC,
      body: 'Public registration booth will stay open this Friday after Jumuah prayer.',
      createdBy: admin._id,
      imageUrl: image('notice-public'),
      pinned: true,
      title: contentTitles.notices[0],
    },
    {
      audience: AUDIENCES.MEMBERS,
      body: 'Members are requested to clear the current monthly fee before the next meeting.',
      createdBy: admin._id,
      imageUrl: image('notice-member-fee'),
      pinned: true,
      title: contentTitles.notices[1],
    },
    {
      audience: AUDIENCES.MEMBERS,
      body: 'The verified income and expense report is available inside the admin finance panel.',
      createdBy: admin._id,
      imageUrl: image('notice-finance'),
      pinned: false,
      title: contentTitles.notices[2],
    },
  ])

  await Meeting.create([
    {
      agenda: 'Review monthly income, unpaid list, and pending donations.',
      attendance: members.map((member, index) => ({
        member: member._id,
        note: index === 5 ? 'Out of village' : '',
        status: index === 5 ? 'excused' : index === 4 ? 'absent' : 'present',
      })),
      audience: AUDIENCES.MEMBERS,
      createdBy: admin._id,
      imageUrl: image('meeting-finance'),
      location: 'Dargah Para community room',
      meetingDate: dateFromNow(3),
      minutes: 'Seed minutes: finance report reviewed, collection team assigned, and next action list prepared.',
      title: contentTitles.meetings[0],
    },
    {
      agenda: 'Finalize Eid volunteer duties and community meal plan.',
      audience: AUDIENCES.PUBLIC,
      createdBy: admin._id,
      imageUrl: image('meeting-eid'),
      location: 'Central mosque courtyard',
      meetingDate: dateFromNow(10),
      title: contentTitles.meetings[1],
    },
    {
      agenda: 'Discuss updated member rules, attendance expectations, and payment verification flow.',
      audience: AUDIENCES.MEMBERS,
      createdBy: admin._id,
      imageUrl: image('meeting-rules'),
      location: 'School veranda',
      meetingDate: dateFromNow(17),
      title: contentTitles.meetings[2],
    },
  ])

  await Tour.create([
    {
      audience: AUDIENCES.MEMBERS,
      budget: 24000,
      createdBy: admin._id,
      destination: 'Sylhet',
      details: 'Family-friendly one day educational and community bonding trip.',
      endDate: dateFromNow(35),
      imageUrl: image('tour-sylhet'),
      participants: members.slice(0, 5).map((member, index) => ({
        amountDue: 1000,
        member: member._id,
        note: index === 2 ? 'Will join with family' : '',
        paidAmount: index < 3 ? 1000 : 500,
        status: index < 3 ? 'paid' : 'confirmed',
      })),
      startDate: dateFromNow(34),
      status: ITEM_STATUSES.PLANNED,
      title: contentTitles.tours[0],
    },
    {
      audience: AUDIENCES.PUBLIC,
      budget: 8500,
      createdBy: admin._id,
      destination: 'Historic local mosque',
      details: 'Public heritage visit with student discussion session.',
      endDate: dateFromNow(22),
      imageUrl: image('tour-mosque'),
      startDate: dateFromNow(22),
      status: ITEM_STATUSES.ACTIVE,
      title: contentTitles.tours[1],
    },
  ])

  await Activity.create([
    {
      activityDate: dateFromNow(5),
      audience: AUDIENCES.PUBLIC,
      category: 'Education',
      createdBy: admin._id,
      description: 'Free evening coaching support for SSC candidates with volunteer teachers.',
      imageUrl: image('activity-education'),
      participantsCount: 24,
      status: ITEM_STATUSES.ACTIVE,
      title: contentTitles.activities[0],
    },
    {
      activityDate: dateFromNow(-4),
      audience: AUDIENCES.PUBLIC,
      category: 'Social work',
      createdBy: admin._id,
      description: 'Youth members cleaned the roadside and repaired the public notice board area.',
      imageUrl: image('activity-clean'),
      participantsCount: 31,
      status: ITEM_STATUSES.COMPLETED,
      title: contentTitles.activities[1],
    },
    {
      activityDate: dateFromNow(12),
      audience: AUDIENCES.MEMBERS,
      category: 'Skill development',
      createdBy: admin._id,
      description: 'Members will learn basic spreadsheet tracking for organization accounts.',
      imageUrl: image('activity-computer'),
      participantsCount: 16,
      status: ITEM_STATUSES.PLANNED,
      title: contentTitles.activities[2],
    },
  ])

  await Rule.create([
    {
      audience: AUDIENCES.MEMBERS,
      createdBy: admin._id,
      description: 'Monthly member fee should be submitted before the 10th day of every month.',
      order: 1,
      title: contentTitles.rules[0],
    },
    {
      audience: AUDIENCES.MEMBERS,
      createdBy: admin._id,
      description: 'Members should attend weekly meetings or share a reason before the meeting starts.',
      order: 2,
      title: contentTitles.rules[1],
    },
    {
      audience: AUDIENCES.PUBLIC,
      createdBy: admin._id,
      description: 'Donation submissions are visible only after admin verification.',
      order: 3,
      title: contentTitles.rules[2],
    },
  ])

  await Blog.create([
    {
      audience: AUDIENCES.PUBLIC,
      body: 'Every verified payment, donation, and expense should be easy for members to review. This sample blog shows how members can write updates for the whole village.',
      comments: [
        {
          body: 'Good reminder for everyone.',
          user: members[1]._id,
        },
        {
          body: 'The finance summary is now easier to understand.',
          user: members[2]._id,
        },
      ],
      createdBy: members[0]._id,
      imageUrl: image('blog-transparency'),
      likes: members.slice(1, 5).map((member) => ({ user: member._id })),
      title: contentTitles.blogs[0],
    },
    {
      audience: AUDIENCES.PUBLIC,
      body: 'The coaching program helped several students prepare with regular practice sessions. Members can use blogs to share these progress stories.',
      comments: [
        {
          body: 'Please continue this program next month.',
          user: members[4]._id,
        },
      ],
      createdBy: members[2]._id,
      imageUrl: image('blog-coaching'),
      likes: members.slice(0, 3).map((member) => ({ user: member._id })),
      title: contentTitles.blogs[1],
    },
    {
      audience: AUDIENCES.MEMBERS,
      body: 'Tour participants should confirm their seats and update payment status before the final planning meeting.',
      comments: [],
      createdBy: members[3]._id,
      imageUrl: image('blog-tour'),
      likes: members.slice(0, 2).map((member) => ({ user: member._id })),
      title: contentTitles.blogs[2],
    },
  ])

  await GalleryItem.create([
    {
      audience: AUDIENCES.PUBLIC,
      createdBy: members[0]._id,
      description: 'Members reviewing the latest finance and activity plan.',
      imageUrl: image('gallery-meeting'),
      title: contentTitles.gallery[0],
    },
    {
      audience: AUDIENCES.PUBLIC,
      createdBy: members[1]._id,
      description: 'Books and notebooks prepared for student support.',
      imageUrl: image('gallery-materials'),
      title: contentTitles.gallery[1],
    },
    {
      audience: AUDIENCES.PUBLIC,
      createdBy: members[2]._id,
      description: 'Youth volunteers after the clean village campaign.',
      imageUrl: image('gallery-clean'),
      title: contentTitles.gallery[2],
    },
    {
      audience: AUDIENCES.MEMBERS,
      createdBy: members[3]._id,
      description: 'Internal record photo from a donation handover.',
      imageUrl: image('gallery-donation'),
      title: contentTitles.gallery[3],
    },
  ])
}

const seedNotificationsAndAudit = async (admin, members) => {
  await Notification.create([
    {
      createdBy: admin._id,
      link: '/member',
      message: 'Seed data is ready. Please review your payment and meeting sections.',
      title: 'Seed: Dashboard ready',
      type: 'general',
      user: members[0]._id,
    },
    {
      createdBy: admin._id,
      link: '/member',
      message: 'The next finance review meeting has attendance tracking enabled.',
      title: 'Seed: Meeting reminder',
      type: 'meeting',
      user: members[1]._id,
    },
    {
      createdBy: admin._id,
      link: '/notifications',
      message: 'This unread sample alert helps test the notification page.',
      title: 'Seed: Unread alert',
      type: 'account',
      user: members[2]._id,
    },
  ])

  await AuditLog.create([
    {
      action: 'seed.data.refresh',
      actor: admin._id,
      entityType: 'Seed',
      metadata: {
        members: members.length,
        note: 'Demo visual dataset inserted',
      },
    },
    {
      action: 'seed.finance.review',
      actor: admin._id,
      entityType: 'Payment',
      metadata: {
        month: monthFromNow(0),
        status: 'sample verified and pending payments',
      },
    },
  ])
}

const run = async () => {
  try {
    await connectDB()
    await removePreviousSeedData()

    const admin = await findOrCreateAdmin()
    await seedSettings()
    const members = await seedUsers(admin)
    await seedFinance(admin, members)
    await seedContent(admin, members)
    await seedNotificationsAndAudit(admin, members)

    console.log('Seed data inserted successfully.')
    console.log(`Admin phone: ${admin.phone}`)
    console.log(`Demo member password: ${demoPassword}`)
    console.log('Demo member phones: 01710000001 to 01710000006')
  } catch (error) {
    console.error('Seed failed:', error)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

run()
