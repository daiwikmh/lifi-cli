export async function GET() {
  const res = await fetch('https://earn.li.fi/v1/earn/protocols', {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 300 },
  })
  if (!res.ok) {
    return Response.json({ error: `LI.FI API error: ${res.status}` }, { status: res.status })
  }
  const raw = await res.json()
  const protocols = Array.isArray(raw) ? raw : (raw.protocols ?? [])
  return Response.json(protocols)
}
