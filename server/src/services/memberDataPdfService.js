const PDFDocument = require('pdfkit')

const formatDate = (value) => {
  if (!value) {
    return 'N/A'
  }

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatMoney = (value = 0) => `Tk ${Number(value || 0).toLocaleString('en-US')}`

const stripHtml = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const writeLine = (doc, label, value) => {
  const text = value === undefined || value === null || value === '' ? 'N/A' : String(value)

  doc.font('Helvetica-Bold').fillColor('#222831').text(`${label}: `, { continued: true })
  doc.font('Helvetica').fillColor('#393E46').text(text)
}

const writeSectionTitle = (doc, title) => {
  doc.moveDown(1)
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#00ADB5').text(title)
  doc.moveDown(0.4)
  doc.fontSize(10)
}

const writeList = (doc, rows, renderRow, emptyText) => {
  if (!rows.length) {
    doc.font('Helvetica').fillColor('#6F7A82').text(emptyText)
    return
  }

  rows.slice(0, 12).forEach((row, index) => {
    doc.font('Helvetica').fillColor('#393E46').text(`${index + 1}. ${renderRow(row)}`, {
      lineGap: 2,
    })
  })
}

const createMemberDataPdf = ({ data, generatedAt = new Date(), organizationName = 'Dargah Para OIkko Porishod' }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' })
    const chunks = []
    const { blogs = [], donations = [], meetings = [], payments = [], profile = {}, tours = [] } = data

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.rect(0, 0, doc.page.width, 96).fill('#222831')
    doc.rect(0, 96, doc.page.width, 22).fill('#393E46')
    doc.rect(0, 118, doc.page.width, 6).fill('#00ADB5')
    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(20)
      .text(organizationName, 48, 32)
    doc.font('Helvetica').fontSize(10).text('Member personal data export', 48, 60)
    doc.fillColor('#222831').fontSize(10).text(`Generated: ${formatDate(generatedAt)}`, 48, 146)

    writeSectionTitle(doc, 'Profile')
    writeLine(doc, 'Name', profile.name)
    writeLine(doc, 'Phone', profile.phone)
    writeLine(doc, 'Email', profile.email)
    writeLine(doc, 'Address', profile.address)
    writeLine(doc, 'Member ID', profile._id)
    writeLine(doc, 'Role', profile.role)
    writeLine(doc, 'Status', profile.status)
    writeLine(doc, 'Joined', formatDate(profile.approvedAt || profile.createdAt))

    writeSectionTitle(doc, 'Summary')
    writeLine(doc, 'Payments', String(payments.length))
    writeLine(doc, 'Donations', String(donations.length))
    writeLine(doc, 'Blogs', String(blogs.length))
    writeLine(doc, 'Meetings attended', String(meetings.length))
    writeLine(doc, 'Tours registered', String(tours.length))

    writeSectionTitle(doc, 'Payment Records')
    writeList(
      doc,
      payments,
      (payment) =>
        `${payment.month || 'N/A'} | ${formatMoney(payment.amount)} | ${payment.status || 'N/A'} | ${payment.method || 'N/A'}`,
      'No payment records found.',
    )

    writeSectionTitle(doc, 'Donation Records')
    writeList(
      doc,
      donations,
      (donation) =>
        `${formatDate(donation.createdAt)} | ${formatMoney(donation.amount)} | ${donation.status || 'N/A'} | ${donation.method || 'N/A'}`,
      'No donation records found.',
    )

    writeSectionTitle(doc, 'Blogs')
    writeList(
      doc,
      blogs,
      (blog) => `${blog.title || 'Untitled'} | ${blog.moderationStatus || 'N/A'} | ${stripHtml(blog.body).slice(0, 80)}`,
      'No blogs found.',
    )

    writeSectionTitle(doc, 'Meetings')
    writeList(
      doc,
      meetings,
      (meeting) => `${meeting.title || 'Meeting'} | ${formatDate(meeting.meetingDate)} | ${meeting.location || 'N/A'}`,
      'No meeting attendance records found.',
    )

    writeSectionTitle(doc, 'Tours')
    writeList(
      doc,
      tours,
      (tour) => `${tour.title || 'Tour'} | ${tour.destination || 'N/A'} | ${formatDate(tour.startDate)}`,
      'No tour registrations found.',
    )

    doc.moveDown(2)
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#6F7A82')
      .text('This file was generated automatically from the member account records.')
    doc.end()
  })

module.exports = {
  createMemberDataPdf,
}
