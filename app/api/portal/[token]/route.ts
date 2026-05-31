import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      requiredDocs: { include: { documentType: true } },
      uploadedDocs: { include: { documentType: true } },
      onboarding: true,
    },
  })

  if (!quote) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })

  return NextResponse.json(quote)
}
