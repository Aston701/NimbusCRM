import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateQuotePDF } from '@/lib/pdf'
import { sendQuoteEmail } from '@/lib/email'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      client: true,
      items: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const acceptToken = quote.acceptToken || uuidv4()

  const pdfBuffer = await generateQuotePDF({
    quoteNumber: quote.quoteNumber,
    createdAt: quote.createdAt,
    validUntil: quote.validUntil,
    contractTerm: quote.contractTerm,
    status: quote.status,
    notes: quote.notes,
    client: quote.client,
    items: quote.items,
    totalOnceOff: quote.totalOnceOff,
    totalMonthly: quote.totalMonthly,
  })

  await sendQuoteEmail({
    to: quote.client.email,
    toName: quote.client.companyName,
    quoteNumber: quote.quoteNumber,
    contactPerson: quote.client.contactPerson,
    pdfBuffer,
    acceptToken,
  })

  await prisma.quote.update({
    where: { id },
    data: {
      status: 'SENT',
      sentAt: new Date(),
      acceptToken,
    },
  })

  return NextResponse.json({ success: true, message: 'Quote sent successfully' })
}
