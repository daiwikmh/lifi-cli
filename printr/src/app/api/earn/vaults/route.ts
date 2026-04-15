import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const params = new URLSearchParams()

  for (const key of ['chainId', 'protocol', 'underlyingToken', 'tags', 'limit', 'cursor']) {
    const val = searchParams.get(key)
    if (val) params.set(key, val)
  }
  if (!params.has('limit')) params.set('limit', '20')

  const res = await fetch(`https://earn.li.fi/v1/earn/vaults?${params}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    return Response.json({ error: `LI.FI API error: ${res.status}` }, { status: res.status })
  }
  return Response.json(await res.json())
}
