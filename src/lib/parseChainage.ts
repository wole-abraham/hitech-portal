export function parseChainage(ch: string): number {
  if (!ch) return 0
  const cleaned = ch.replaceAll(' ', '')
  if (cleaned.includes('+')) {
    const [a, b] = cleaned.split('+')
    return parseFloat(a) * 1000 + parseFloat(b)
  }
  return parseFloat(cleaned) || 0
}
