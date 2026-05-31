import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateQuotePDF } from '@/lib/pdf'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Quote_${quote.quoteNumber}.pdf"`,
    },
  })
}
