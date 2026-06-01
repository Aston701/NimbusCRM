import PDFDocument from 'pdfkit'
import { format } from 'date-fns'

interface QuoteItem {
  description: string
  quantity?: number
  costPrice: number
  sellPrice: number
  isRecurring: boolean
  recurringCostPrice?: number | null
  recurringSellPrice?: number | null
}

interface QuotePDFData {
  quoteNumber: string
  createdAt: Date
  validUntil?: Date | null
  contractTerm: number
  status: string
  notes?: string | null
  client: {
    companyName: string
    tradingName?: string | null
    contactPerson: string
    email: string
    phone: string
    address?: string | null
    city?: string | null
    province?: string | null
    postalCode?: string | null
    vatNo?: string | null
    registrationNo?: string | null
  }
  items: QuoteItem[]
  totalOnceOff: number
  totalMonthly: number
  onboarding?: {
    bankName?: string | null
    accountHolder?: string | null
    accountNumber?: string | null
    accountType?: string | null
    branchCode?: string | null
    debitOrderAuthorized?: boolean
    debitOrderSignature?: string | null
    debitOrderSignedAt?: Date | null
    debitOrderAmount?: number | null
  } | null
}

function formatZAR(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const BLUE = '#1e40af'
const LIGHT_BLUE = '#dbeafe'
const DARK = '#1f2937'
const GREY = '#6b7280'
const WHITE = '#ffffff'
const LIGHT_GREY = '#f9fafb'

function buildPDF(quote: QuotePDFData, isCOF: boolean): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const company = {
      name: process.env.COMPANY_NAME || 'Dynamic Business Systems',
      email: process.env.COMPANY_EMAIL || '',
      phone: process.env.COMPANY_PHONE || '',
      address: process.env.COMPANY_ADDRESS || '',
      vatNo: process.env.COMPANY_VAT_NO || '',
      regNo: process.env.COMPANY_REG_NO || '',
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageWidth = doc.page.width - 100
    const leftCol = 50

    // ─── HEADER ──────────────────────────────────────────────────────────
    doc.rect(50, 40, pageWidth, 80).fill(BLUE)

    doc.fillColor(WHITE).fontSize(20).font('Helvetica-Bold')
      .text(company.name, 65, 52)

    doc.fillColor(WHITE).fontSize(8).font('Helvetica')
    let companyY = 76
    if (company.email) { doc.text(company.email, 65, companyY); companyY += 11 }
    if (company.phone) { doc.text(company.phone, 65, companyY); companyY += 11 }
    if (company.address) doc.text(company.address, 65, companyY)

    // Right side of header
    doc.fillColor(WHITE).fontSize(16).font('Helvetica-Bold')
      .text(isCOF ? 'CUSTOMER ORDER FORM' : 'QUOTATION', 0, 52, { align: 'right', width: doc.page.width - 65 })

    doc.fontSize(9).font('Helvetica')
    const rightLines = [
      quote.quoteNumber,
      `Date: ${format(new Date(quote.createdAt), 'dd MMM yyyy')}`,
      quote.validUntil ? `Valid Until: ${format(new Date(quote.validUntil), 'dd MMM yyyy')}` : null,
      `Contract Term: ${quote.contractTerm} month${quote.contractTerm !== 1 ? 's' : ''}`,
    ].filter(Boolean) as string[]

    let rY = 75
    for (const line of rightLines) {
      doc.text(line, 0, rY, { align: 'right', width: doc.page.width - 65 })
      rY += 12
    }

    // ─── CLIENT DETAILS ───────────────────────────────────────────────────
    let y = 140

    doc.fillColor(BLUE).fontSize(9).font('Helvetica-Bold')
      .text('CLIENT DETAILS', leftCol, y)
    doc.moveTo(leftCol, y + 13).lineTo(leftCol + pageWidth, y + 13).strokeColor(LIGHT_BLUE).lineWidth(1).stroke()
    y += 18

    const clientLines: [string, string][] = [
      ['Company Name', quote.client.companyName],
      ...(quote.client.tradingName ? [['Trading As', quote.client.tradingName] as [string, string]] : []),
      ['Contact Person', quote.client.contactPerson],
      ['Email', quote.client.email],
      ['Phone', quote.client.phone],
      ...(quote.client.vatNo ? [['VAT Number', quote.client.vatNo] as [string, string]] : []),
      ...(quote.client.registrationNo ? [['Registration No', quote.client.registrationNo] as [string, string]] : []),
      ...([quote.client.address, quote.client.city, quote.client.province, quote.client.postalCode].filter(Boolean).length > 0
        ? [['Address', [quote.client.address, quote.client.city, quote.client.province, quote.client.postalCode].filter(Boolean).join(', ')] as [string, string]]
        : []),
    ]

    for (const [label, value] of clientLines) {
      doc.fillColor(GREY).fontSize(8).font('Helvetica').text(label + ':', leftCol, y, { width: 110 })
      doc.fillColor(DARK).fontSize(8).font('Helvetica').text(value, leftCol + 115, y, { width: pageWidth - 115 })
      y += 13
    }

    y += 8

    // ─── ONCE-OFF ITEMS ──────────────────────────────────────────────────
    const onceOffItems = quote.items.filter(i => i.sellPrice > 0)
    const recurringItems = quote.items.filter(i => i.isRecurring && (i.recurringSellPrice ?? 0) > 0)

    if (onceOffItems.length > 0) {
      doc.fillColor(BLUE).fontSize(9).font('Helvetica-Bold').text('ONCE-OFF ITEMS', leftCol, y)
      doc.moveTo(leftCol, y + 13).lineTo(leftCol + pageWidth, y + 13).strokeColor(LIGHT_BLUE).lineWidth(1).stroke()
      y += 18

      // Table header
      doc.rect(leftCol, y, pageWidth, 20).fill(BLUE)
      doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold')
        .text('Description', leftCol + 8, y + 6, { width: pageWidth - 190 })
        .text('Qty', leftCol + pageWidth - 182, y + 6, { width: 40, align: 'center' })
        .text('Unit Price', leftCol + pageWidth - 138, y + 6, { width: 70, align: 'right' })
        .text('Total (excl. VAT)', leftCol + pageWidth - 68, y + 6, { width: 60, align: 'right' })
      y += 20

      for (let i = 0; i < onceOffItems.length; i++) {
        const item = onceOffItems[i]
        const qty = item.quantity ?? 1
        const rowH = 20
        if (i % 2 === 1) doc.rect(leftCol, y, pageWidth, rowH).fill(LIGHT_GREY)
        doc.fillColor(DARK).fontSize(8).font('Helvetica')
          .text(item.description, leftCol + 8, y + 6, { width: pageWidth - 190 })
          .text(String(qty), leftCol + pageWidth - 182, y + 6, { width: 40, align: 'center' })
          .text(formatZAR(item.sellPrice), leftCol + pageWidth - 138, y + 6, { width: 70, align: 'right' })
          .text(formatZAR(item.sellPrice * qty), leftCol + pageWidth - 68, y + 6, { width: 60, align: 'right' })
        doc.moveTo(leftCol, y + rowH).lineTo(leftCol + pageWidth, y + rowH).strokeColor('#e5e7eb').lineWidth(0.5).stroke()
        y += rowH
      }
      y += 10
    }

    // ─── RECURRING ITEMS ─────────────────────────────────────────────────
    if (recurringItems.length > 0) {
      doc.fillColor(BLUE).fontSize(9).font('Helvetica-Bold').text('MONTHLY RECURRING ITEMS', leftCol, y)
      doc.moveTo(leftCol, y + 13).lineTo(leftCol + pageWidth, y + 13).strokeColor(LIGHT_BLUE).lineWidth(1).stroke()
      y += 18

      doc.rect(leftCol, y, pageWidth, 20).fill(BLUE)
      doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold')
        .text('Description', leftCol + 8, y + 6, { width: pageWidth - 190 })
        .text('Qty', leftCol + pageWidth - 182, y + 6, { width: 40, align: 'center' })
        .text('Unit Price/mo', leftCol + pageWidth - 138, y + 6, { width: 70, align: 'right' })
        .text('Total/mo (excl. VAT)', leftCol + pageWidth - 68, y + 6, { width: 60, align: 'right' })
      y += 20

      for (let i = 0; i < recurringItems.length; i++) {
        const item = recurringItems[i]
        const qty = item.quantity ?? 1
        const unitPrice = item.recurringSellPrice ?? 0
        const rowH = 20
        if (i % 2 === 1) doc.rect(leftCol, y, pageWidth, rowH).fill(LIGHT_GREY)
        doc.fillColor(DARK).fontSize(8).font('Helvetica')
          .text(item.description, leftCol + 8, y + 6, { width: pageWidth - 190 })
          .text(String(qty), leftCol + pageWidth - 182, y + 6, { width: 40, align: 'center' })
          .text(formatZAR(unitPrice), leftCol + pageWidth - 138, y + 6, { width: 70, align: 'right' })
          .text(formatZAR(unitPrice * qty), leftCol + pageWidth - 68, y + 6, { width: 60, align: 'right' })
        doc.moveTo(leftCol, y + rowH).lineTo(leftCol + pageWidth, y + rowH).strokeColor('#e5e7eb').lineWidth(0.5).stroke()
        y += rowH
      }
      y += 10
    }

    // ─── TOTALS ──────────────────────────────────────────────────────────
    const totalsX = leftCol + pageWidth - 230
    const totalsW = 230

    const totalRows: [string, string, boolean][] = []
    if (quote.totalOnceOff > 0) {
      totalRows.push(['Once-Off Total (excl. VAT)', formatZAR(quote.totalOnceOff), false])
      totalRows.push(['VAT (15%)', formatZAR(quote.totalOnceOff * 0.15), false])
      totalRows.push(['Once-Off Total (incl. VAT)', formatZAR(quote.totalOnceOff * 1.15), false])
    }
    if (quote.totalMonthly > 0) {
      totalRows.push(['Monthly Total (excl. VAT)', formatZAR(quote.totalMonthly), false])
      totalRows.push(['VAT (15%)', formatZAR(quote.totalMonthly * 0.15), false])
      totalRows.push([`Monthly Total (incl. VAT)`, formatZAR(quote.totalMonthly * 1.15), true])
    }

    for (const [label, value, highlight] of totalRows) {
      if (highlight) {
        doc.rect(totalsX, y, totalsW, 22).fill(BLUE)
        doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold')
          .text(label, totalsX + 8, y + 7, { width: 150 })
          .text(value, totalsX + 8, y + 7, { width: totalsW - 16, align: 'right' })
        y += 22
      } else {
        doc.rect(totalsX, y, totalsW, 18).fill(LIGHT_GREY)
        doc.moveTo(totalsX, y + 18).lineTo(totalsX + totalsW, y + 18).strokeColor(LIGHT_BLUE).lineWidth(0.5).stroke()
        doc.fillColor(GREY).fontSize(8).font('Helvetica')
          .text(label, totalsX + 8, y + 5, { width: 150 })
        doc.fillColor(DARK).fontSize(8).font('Helvetica-Bold')
          .text(value, totalsX + 8, y + 5, { width: totalsW - 16, align: 'right' })
        y += 18
      }
    }
    y += 14

    // ─── NOTES ───────────────────────────────────────────────────────────
    if (quote.notes) {
      doc.rect(leftCol, y, 4, 40).fill(BLUE)
      doc.rect(leftCol + 4, y, pageWidth - 4, 40).fill(LIGHT_GREY)
      doc.fillColor(DARK).fontSize(8).font('Helvetica').text(quote.notes, leftCol + 12, y + 6, { width: pageWidth - 20 })
      y += 48
    }

    // ─── TERMS ───────────────────────────────────────────────────────────
    doc.fillColor(BLUE).fontSize(9).font('Helvetica-Bold').text('TERMS & CONDITIONS', leftCol, y)
    doc.moveTo(leftCol, y + 13).lineTo(leftCol + pageWidth, y + 13).strokeColor(LIGHT_BLUE).lineWidth(1).stroke()
    y += 20

    const terms = [
      '1. This quotation is valid for 30 days from the date of issue unless otherwise stated.',
      '2. All prices are exclusive of VAT at 15% unless otherwise stated.',
      '3. Payment terms: 30 days from date of invoice unless otherwise agreed in writing.',
      '4. This quotation constitutes the full scope of work. Additional requirements will be quoted separately.',
      `5. Contract term commences from service activation for ${quote.contractTerm} month${quote.contractTerm !== 1 ? 's' : ''}.`,
    ]
    for (const term of terms) {
      doc.fillColor(GREY).fontSize(7.5).font('Helvetica').text(term, leftCol, y, { width: pageWidth })
      y += 11
    }

    // ─── COF SIGNATURE ───────────────────────────────────────────────────
    if (isCOF) {
      y += 10
      doc.fillColor(BLUE).fontSize(9).font('Helvetica-Bold').text('ACCEPTANCE & AUTHORISATION', leftCol, y)
      doc.moveTo(leftCol, y + 13).lineTo(leftCol + pageWidth, y + 13).strokeColor(LIGHT_BLUE).lineWidth(1).stroke()
      y += 20

      doc.fillColor(DARK).fontSize(8).font('Helvetica')
        .text(`I/We, the undersigned, being duly authorised to sign on behalf of ${quote.client.companyName}, hereby accept the above quotation and agree to the terms and conditions as set out above.`, leftCol, y, { width: pageWidth })
      y += 30

      const sigW = (pageWidth - 30) / 3
      const sigLabels = ['Signature', 'Full Name & Title', 'Date']
      for (let i = 0; i < 3; i++) {
        const sx = leftCol + i * (sigW + 15)
        doc.moveTo(sx, y + 35).lineTo(sx + sigW, y + 35).strokeColor(DARK).lineWidth(0.75).stroke()
        doc.fillColor(GREY).fontSize(7.5).font('Helvetica').text(sigLabels[i], sx, y + 38, { width: sigW })
      }
      y += 55

      // ─── DEBIT ORDER MANDATE ──────────────────────────────────────────
      const ob = quote.onboarding
      y += 10
      doc.fillColor(BLUE).fontSize(9).font('Helvetica-Bold').text('DEBIT ORDER MANDATE', leftCol, y)
      doc.moveTo(leftCol, y + 13).lineTo(leftCol + pageWidth, y + 13).strokeColor(LIGHT_BLUE).lineWidth(1).stroke()
      y += 20

      // Banking details
      if (ob?.bankName || ob?.accountNumber) {
        const bankRows: [string, string][] = [
          ['Bank', ob.bankName || ''],
          ['Account Holder', ob.accountHolder || ''],
          ['Account Number', ob.accountNumber || ''],
          ['Account Type', ob.accountType || ''],
          ['Branch Code', ob.branchCode || ''],
        ].filter(r => r[1]) as [string, string][]

        for (const [label, value] of bankRows) {
          doc.fillColor(GREY).fontSize(8).font('Helvetica').text(label + ':', leftCol, y, { width: 110 })
          doc.fillColor(DARK).fontSize(8).font('Helvetica').text(value, leftCol + 115, y)
          y += 12
        }
        y += 4
      }

      const debitAmount = ob?.debitOrderAmount ?? (quote.totalMonthly * 1.15)
      doc.rect(leftCol, y, pageWidth, 45).fill('#eff6ff')
      doc.fillColor(DARK).fontSize(7.5).font('Helvetica')
        .text(
          `I/We hereby authorise ${company.name} to debit my/our bank account detailed above on the 1st day of each month with the amount of ${formatZAR(debitAmount)} (inclusive of VAT), being the monthly service fee as per our signed agreement. This authority shall remain in force until cancelled by either party in writing with 30 (thirty) days' notice.`,
          leftCol + 8, y + 6,
          { width: pageWidth - 16 }
        )
      y += 52

      // Signature line
      if (ob?.debitOrderAuthorized && ob?.debitOrderSignature) {
        doc.fillColor(GREY).fontSize(8).font('Helvetica').text('Authorised Signature:', leftCol, y)
        y += 4
        const sigData = ob.debitOrderSignature.replace(/^data:image\/png;base64,/, '')
        const sigBuffer = Buffer.from(sigData, 'base64')
        doc.image(sigBuffer, leftCol, y, { width: 160, height: 55 })

        // Date alongside
        if (ob.debitOrderSignedAt) {
          doc.fillColor(GREY).fontSize(8).font('Helvetica')
            .text('Date:', leftCol + 200, y + 20)
          doc.fillColor(DARK).fontSize(8).font('Helvetica-Bold')
            .text(format(new Date(ob.debitOrderSignedAt), 'dd MMM yyyy'), leftCol + 230, y + 20)
        }
        y += 60
      } else {
        const sdW = (pageWidth - 20) / 2
        doc.moveTo(leftCol, y + 40).lineTo(leftCol + sdW, y + 40).strokeColor(DARK).lineWidth(0.75).stroke()
        doc.moveTo(leftCol + sdW + 20, y + 40).lineTo(leftCol + pageWidth, y + 40).strokeColor(DARK).lineWidth(0.75).stroke()
        doc.fillColor(GREY).fontSize(7.5).font('Helvetica')
          .text('Authorised Signature', leftCol, y + 43, { width: sdW })
          .text('Date', leftCol + sdW + 20, y + 43)
        y += 55
      }
    }

    // ─── FOOTER ──────────────────────────────────────────────────────────
    const footerY = doc.page.height - 40
    doc.moveTo(50, footerY - 8).lineTo(50 + pageWidth, footerY - 8).strokeColor('#e5e7eb').lineWidth(0.5).stroke()
    doc.fillColor(GREY).fontSize(7.5).font('Helvetica')
      .text(`${company.name} — ${isCOF ? 'Customer Order Form' : 'Quotation'} ${quote.quoteNumber}`, leftCol, footerY)
      .text(`${company.vatNo ? 'VAT: ' + company.vatNo : ''}`, 0, footerY, { align: 'right', width: doc.page.width - 65 })

    doc.end()
  })
}

export async function generateQuotePDF(quote: QuotePDFData): Promise<Buffer> {
  return buildPDF(quote, false)
}

export async function generateCOFPDF(quote: QuotePDFData): Promise<Buffer> {
  return buildPDF(quote, true)
}
