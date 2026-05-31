import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateCOFPDF } from '@/lib/pdf'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const quote = await prisma.quote.findFirst({
    where: {
      OR: [
        { acceptToken: token },
        { onboarding: { token } },
      ],
    },
    include: {
      client: true,
      items: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const pdfBuffer = await generateCOFPDF({
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
      'Content-Disposition': `attachment; filename="COF_${quote.quoteNumber}.pdf"`,
    },
  })
}
