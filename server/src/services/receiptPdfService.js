const PDFDocument = require('pdfkit')

const formatMoney = (value = 0) => `Tk ${Number(value || 0).toLocaleString('en-US')}`

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

const writeRow = (doc, label, value) => {
  doc.font('Helvetica-Bold').text(label, { continued: true })
  doc.font('Helvetica').text(` ${value || 'N/A'}`)
}

const createReceiptPdf = ({
  amount,
  date,
  method,
  organization,
  payerAddress = '',
  payerName,
  payerPhone = '',
  receiptNo,
  status,
  transactionId,
  type,
}) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 48,
      size: 'A4',
    })
    const chunks = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#0f172a')
      .text(organization.name, { align: 'center' })
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#475569')
      .text('Official payment receipt', { align: 'center' })
      .moveDown(1)

    doc
      .roundedRect(48, doc.y, 500, 64, 8)
      .fillAndStroke('#ecfdf5', '#a7f3d0')
      .fillColor('#0f172a')
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(`Receipt No: ${receiptNo}`, 68, doc.y - 52)
    doc
      .font('Helvetica')
      .fontSize(11)
      .text(`Type: ${type}`, 68)
      .text(`Generated: ${formatDate(new Date())}`, 68)
      .moveDown(2)

    doc.fontSize(12).fillColor('#0f172a')
    writeRow(doc, 'Name:', payerName)
    writeRow(doc, 'Phone:', payerPhone)
    writeRow(doc, 'Address:', payerAddress)
    writeRow(doc, 'Amount:', formatMoney(amount))
    writeRow(doc, 'Payment Method:', method)
    writeRow(doc, 'Transaction ID:', transactionId)
    writeRow(doc, 'Payment Date:', formatDate(date))
    writeRow(doc, 'Status:', status)

    doc.moveDown(3)
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#475569')
      .text('Admin signature placeholder', 48)
      .moveDown(1)
    doc.moveTo(48, doc.y).lineTo(230, doc.y).stroke('#94a3b8')
    doc.moveDown(2)
    doc
      .fontSize(9)
      .fillColor('#64748b')
      .text('This PDF receipt was generated automatically by the organization management system.')

    doc.end()
  })

module.exports = {
  createReceiptPdf,
}
