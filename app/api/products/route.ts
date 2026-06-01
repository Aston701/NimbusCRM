import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  costPrice: z.number().min(0).default(0),
  sellPrice: z.number().min(0).default(0),
  isRecurring: z.boolean().default(false),
  recurringCostPrice: z.number().min(0).optional().nullable(),
  recurringSellPrice: z.number().min(0).optional().nullable(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const all = new URL(req.url).searchParams.get('all') === '1'

  const products = await prisma.product.findMany({
    where: all ? undefined : { isActive: true },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  })

  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = productSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const product = await prisma.product.create({ data: parsed.data })
  return NextResponse.json(product, { status: 201 })
}
