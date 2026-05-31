import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOnboardingEmail } from '@/lib/email'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const quote = await prisma.quote.findUnique({
    where: { acceptToken: token },
    include: {
      client: true,
      requiredDocs: { include: { documentType: true } },
    },
  })

  if (!quote) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  if (quote.status === 'ACCEPTED') {
    return NextResponse.json({ error: 'Quote already accepted' }, { status: 400 })
  }

  const onboardingToken = uuidv4()

  await prisma.$transaction([
    prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    }),
    prisma.onboarding.create({
      data: {
        quoteId: quote.id,
        token: onboardingToken,
      },
    }),
  ])

  const requiredDocNames = quote.requiredDocs.map((d: { documentType: { name: string } }) => d.documentType.name)

  await sendOnboardingEmail({
    to: quote.client.email,
    toName: quote.client.companyName,
    contactPerson: quote.client.contactPerson,
    quoteNumber: quote.quoteNumber,
    onboardingToken,
    requiredDocuments: requiredDocNames,
  })

  return NextResponse.json({ success: true, onboardingToken })
}
