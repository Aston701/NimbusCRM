import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateQuoteNumber } from '@/lib/utils'
import { z } from 'zod'

const itemSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  costPrice: z.number().min(0),
  sellPrice: z.number().min(0),
  isRecurring: z.boolean().default(false),
  recurringCostPrice: z.number().min(0).optional().nullable(),
  recurringSellPrice: z.number().min(0).optional().nullable(),
  sortOrder: z.number().int().default(0),
})

const quoteSchema = z.object({
  clientId: z.string().min(1),
  contractTerm: z.number().int().min(1),
  validUntil: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1),
  requiredDocIds: z.array(z.string()).default([]),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const clientId = searchParams.get('clientId')

  const quotes = await prisma.quote.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(clientId ? { clientId } : {}),
    },
    include: {
      client: { select: { companyName: true, contactPerson: true } },
      createdBy: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(quotes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = quoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { items, requiredDocIds, validUntil, ...quoteData } = parsed.data

  const totalOnceOff = items.reduce((sum, i) => sum + i.sellPrice * (i.quantity ?? 1), 0)
  const totalMonthly = items.reduce(
    (sum, i) => sum + (i.isRecurring ? (i.recurringSellPrice ?? 0) * (i.quantity ?? 1) : 0),
    0
  )

  const quoteNumber = await generateQuoteNumber()

  const quote = await prisma.quote.create({
    data: {
      ...quoteData,
      quoteNumber,
      validUntil: validUntil ? new Date(validUntil) : null,
      totalOnceOff,
      totalMonthly,
      createdById: session.user.id,
      items: {
        create: items.map((item, idx) => ({ ...item, sortOrder: idx })),
      },
      requiredDocs: {
        create: requiredDocIds.map(docId => ({ documentTypeId: docId })),
      },
    },
    include: { client: true, items: true },
  })

  return NextResponse.json(quote, { status: 201 })
}
