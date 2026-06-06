'use client'

// Text-only logo — no image dependency
export default function BrandLogo({
  size = 'md',
  dark = false,
}: {
  size?: 'sm' | 'md' | 'lg'
  dark?: boolean
}) {
  const name  = process.env.NEXT_PUBLIC_APP_NAME    || 'PORTAL'
  const sub   = process.env.NEXT_PUBLIC_APP_COMPANY || 'Field Operations Ltd'

  const fontSize = size === 'sm' ? '1.1rem' : size === 'lg' ? '3.6rem' : '2.2rem'
  const subSize  = size === 'sm' ? '0.52rem' : size === 'lg' ? '0.72rem' : '0.6rem'

  return (
    <div style={{ userSelect: 'none' }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize,
        letterSpacing: '-0.04em',
        lineHeight: 0.9,
        color: dark ? '#f2b950' : '#1a1610',
      }}>
        {name}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: subSize,
        letterSpacing: '0.18em',
        color: dark ? '#8c7a58' : '#6b6055',
        textTransform: 'uppercase',
        marginTop: 6,
      }}>
        {sub}
      </div>
    </div>
  )
}
