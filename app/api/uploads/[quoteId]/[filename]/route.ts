import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ quoteId: string; filename: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { quoteId, filename } = await params

  const doc = await prisma.clientDocument.findFirst({
    where: { quoteId, fileName: filename },
  })

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const filePath = path.join(process.cwd(), 'uploads', quoteId, filename)

  try {
    const fileBuffer = await readFile(filePath)
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': doc.mimeType,
        'Content-Disposition': `inline; filename="${doc.originalName}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
  }
}
