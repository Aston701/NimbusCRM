import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await hash('Admin@123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dynamicbusiness.co.za' },
    update: {},
    create: {
      email: 'admin@dynamicbusiness.co.za',
      password: adminPassword,
      name: 'System Admin',
      role: 'ADMIN',
    },
  })
  console.log('Admin user created:', admin.email)

  // Create document types
  const docTypes = [
    {
      name: 'VAT Certificate',
      description: 'SARS-issued VAT registration certificate',
    },
    {
      name: 'Proof of Banking',
      description: 'Bank-stamped letter or official bank statement (not older than 3 months)',
    },
    {
      name: 'Company Registration Documents',
      description: 'COR14.3 or CIPC registration certificate',
    },
    {
      name: 'ID Document - Director',
      description: 'Certified copy of ID/passport of a director or authorized signatory',
    },
    {
      name: 'Proof of Address',
      description: 'Municipal bill or official correspondence (not older than 3 months)',
    },
    {
      name: 'Signed Customer Order Form (COF)',
      description: 'The Customer Order Form signed by an authorized signatory',
    },
    {
      name: 'FICA Documents',
      description: 'FICA compliance documentation',
    },
    {
      name: 'Tax Clearance Certificate',
      description: 'Valid SARS tax clearance / compliance status pin',
    },
  ]

  for (const dt of docTypes) {
    await prisma.documentType.upsert({
      where: { name: dt.name },
      update: {},
      create: dt,
    })
    console.log('Document type created:', dt.name)
  }

  console.log('\nSeed complete!')
  console.log('Login: admin@dynamicbusiness.co.za / Admin@123')
  console.log('IMPORTANT: Change the admin password after first login!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
