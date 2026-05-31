import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOnboardingCompleteNotification } from '@/lib/email'
import { z } from 'zod'

const submitSchema = z.object({
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  vatNo: z.string().optional(),
  registrationNo: z.string().optional(),
  bankName: z.string().optional(),
  accountHolder: z.string().optional(),
  accountNumber: z.string().optional(),
  accountType: z.string().optional(),
  branchCode: z.string().optional(),
  cofSigned: z.boolean().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const onboarding = await prisma.onboarding.findUnique({
    where: { token },
    include: { quote: { include: { client: true, createdBy: true } } },
  })

  if (!onboarding) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  if (onboarding.status === 'SUBMITTED') {
    return NextResponse.json({ error: 'Already submitted' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  await prisma.onboarding.update({
    where: { id: onboarding.id },
    data: {
      ...parsed.data,
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
  })

  await sendOnboardingCompleteNotification({
    staffEmail: onboarding.quote.createdBy.email,
    clientName: onboarding.quote.client.companyName,
    quoteNumber: onboarding.quote.quoteNumber,
    quoteId: onboarding.quote.id,
  })

  return NextResponse.json({ success: true })
}
