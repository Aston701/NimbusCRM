import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const onboarding = await prisma.onboarding.findUnique({
    where: { token },
    include: { quote: true },
  })

  if (!onboarding) {
    const quote = await prisma.quote.findUnique({ where: { acceptToken: token } })
    if (!quote || quote.status !== 'ACCEPTED') {
      return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
    }
  }

  const quoteId = onboarding?.quoteId || (
    await prisma.quote.findUnique({ where: { acceptToken: token } })
  )?.id

  if (!quoteId) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const documentTypeId = formData.get('documentTypeId') as string | null
  const label = formData.get('label') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }

  const uploadDir = path.join(process.cwd(), 'uploads', quoteId)
  await mkdir(uploadDir, { recursive: true })

  const ext = path.extname(file.name)
  const safeId = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
  const filePath = path.join(uploadDir, safeId)

  const bytes = await file.arrayBuffer()
  await writeFile(filePath, Buffer.from(bytes))

  const doc = await prisma.clientDocument.create({
    data: {
      quoteId: quoteId as string,
      documentTypeId: documentTypeId || null,
      label: label || file.name,
      fileName: safeId,
      originalName: file.name,
      filePath: `uploads/${quoteId}/${safeId}`,
      fileSize: file.size,
      mimeType: file.type,
    },
    include: { documentType: true },
  })

  return NextResponse.json(doc, { status: 201 })
}
