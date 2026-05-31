import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { prisma } from './prisma'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatZAR(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.quote.count()
  const sequence = String(count + 1).padStart(4, '0')
  return `DBS-${year}-${sequence}`
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-700'
    case 'SENT':
      return 'bg-blue-100 text-blue-700'
    case 'ACCEPTED':
      return 'bg-green-100 text-green-700'
    case 'REJECTED':
      return 'bg-red-100 text-red-700'
    case 'EXPIRED':
      return 'bg-yellow-100 text-yellow-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    SENT: 'Sent',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
    EXPIRED: 'Expired',
  }
  return labels[status] || status
}
