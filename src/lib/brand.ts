// All branding comes from env vars — change these per deployment
export const brand = {
  name:    process.env.NEXT_PUBLIC_APP_NAME    || 'PORTAL',
  company: process.env.NEXT_PUBLIC_APP_COMPANY || 'Field Operations Ltd',
  tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || 'Daily Activity & Asset Management',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL    || 'http://localhost:3000',

  // Server-only (API routes / emails)
  emailFrom:   process.env.RESEND_FROM_EMAIL   || 'noreply@example.com',
  emailFooter: process.env.NEXT_PUBLIC_APP_COMPANY || 'Field Operations Ltd',
}
