import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
})

const company = {
  name: process.env.COMPANY_NAME || 'Dynamic Business Systems',
  email: process.env.COMPANY_EMAIL || '',
  phone: process.env.COMPANY_PHONE || '',
  address: process.env.COMPANY_ADDRESS || '',
}

const appUrl = process.env.APP_URL || 'http://localhost:3000'
const fromEmail = process.env.EMAIL_FROM || `${company.name} <noreply@localhost>`

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
  .container { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .header { background: #1e40af; color: #fff; padding: 24px 32px; }
  .header h1 { margin: 0; font-size: 22px; }
  .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.8; }
  .body { padding: 32px; color: #333; line-height: 1.6; }
  .btn { display: inline-block; background: #2563eb; color: #fff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 15px; font-weight: bold; margin: 20px 0; }
  .btn-success { background: #16a34a; }
  .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  .info-table td { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
  .info-table td:first-child { color: #666; width: 40%; }
  .footer { background: #f9fafb; padding: 20px 32px; font-size: 12px; color: #888; border-top: 1px solid #eee; }
  .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>${company.name}</h1>
    <p>${company.email} | ${company.phone}</p>
  </div>
  <div class="body">
    ${content}
  </div>
  <div class="footer">
    <p>${company.name} | ${company.address}</p>
    <p>This is an automated email. Please do not reply directly to this message.</p>
  </div>
</div>
</body>
</html>`
}

export async function sendQuoteEmail({
  to,
  toName,
  quoteNumber,
  contactPerson,
  pdfBuffer,
  acceptToken,
}: {
  to: string
  toName: string
  quoteNumber: string
  contactPerson: string
  pdfBuffer: Buffer
  acceptToken: string
}) {
  const acceptUrl = `${appUrl}/portal/${acceptToken}`

  const html = baseTemplate(`
    <p>Dear ${contactPerson},</p>
    <p>Thank you for your interest in our services. Please find attached your quotation <strong>${quoteNumber}</strong> from ${company.name}.</p>
    <p>Please review the attached PDF for the full details of your quote. If you are happy to proceed, click the button below to accept the quotation:</p>
    <a href="${acceptUrl}" class="btn btn-success">Accept Quotation</a>
    <p>Or copy and paste this link into your browser:<br><a href="${acceptUrl}">${acceptUrl}</a></p>
    <hr class="divider">
    <p>If you have any questions or would like to discuss this quotation, please don't hesitate to contact us.</p>
    <p>We look forward to hearing from you.</p>
    <p>Kind regards,<br><strong>${company.name}</strong></p>
  `)

  await transporter.sendMail({
    from: fromEmail,
    to: `${toName} <${to}>`,
    subject: `Quotation ${quoteNumber} from ${company.name}`,
    html,
    attachments: [
      {
        filename: `Quote_${quoteNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  })
}

export async function sendOnboardingEmail({
  to,
  toName,
  contactPerson,
  quoteNumber,
  onboardingToken,
  requiredDocuments,
}: {
  to: string
  toName: string
  contactPerson: string
  quoteNumber: string
  onboardingToken: string
  requiredDocuments: string[]
}) {
  const portalUrl = `${appUrl}/portal/${onboardingToken}`

  const docList = requiredDocuments.map(d => `<li>${d}</li>`).join('')

  const html = baseTemplate(`
    <p>Dear ${contactPerson},</p>
    <p>Congratulations! Your quotation <strong>${quoteNumber}</strong> has been accepted. We are excited to get started!</p>
    <p>To complete your onboarding, please click the button below to access your secure client portal where you can:</p>
    <ul>
      <li>Confirm your company and contact details</li>
      <li>Upload your required documentation</li>
      <li>Download and sign your Customer Order Form (COF)</li>
    </ul>
    <a href="${portalUrl}" class="btn">Complete Onboarding</a>
    <p>Or copy and paste this link into your browser:<br><a href="${portalUrl}">${portalUrl}</a></p>
    <hr class="divider">
    <p><strong>Required Documents:</strong></p>
    <ul>${docList}</ul>
    <p>Please have all documents ready before completing the portal form.</p>
    <p>If you have any questions, please contact us at ${company.email} or ${company.phone}.</p>
    <p>Kind regards,<br><strong>${company.name}</strong></p>
  `)

  await transporter.sendMail({
    from: fromEmail,
    to: `${toName} <${to}>`,
    subject: `Complete Your Onboarding - ${quoteNumber}`,
    html,
  })
}

export async function sendOnboardingCompleteNotification({
  staffEmail,
  clientName,
  quoteNumber,
  quoteId,
}: {
  staffEmail: string
  clientName: string
  quoteNumber: string
  quoteId: string
}) {
  const quoteUrl = `${appUrl}/quotes/${quoteId}`

  const html = baseTemplate(`
    <p>A client has completed their onboarding process.</p>
    <table class="info-table">
      <tr><td>Client</td><td><strong>${clientName}</strong></td></tr>
      <tr><td>Quote</td><td><strong>${quoteNumber}</strong></td></tr>
    </table>
    <p>All required documents have been uploaded and the Customer Order Form has been signed.</p>
    <a href="${quoteUrl}" class="btn">View Quote & Documents</a>
    <p>Please review the uploaded documents and proceed with the next steps.</p>
  `)

  await transporter.sendMail({
    from: fromEmail,
    to: staffEmail,
    subject: `Onboarding Complete: ${clientName} - ${quoteNumber}`,
    html,
  })
}
