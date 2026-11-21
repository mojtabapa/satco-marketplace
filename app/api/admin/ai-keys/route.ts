import { readDb, saveKey } from '@/lib/ai-keys'

const authorized = (req: Request) =>
  !!process.env.ADMIN_PASSWORD && req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
const deny = () => Response.json({ error: 'رمز مدیر نادرست است یا ADMIN_PASSWORD تنظیم نشده.' }, { status: 401 })

export async function GET(req: Request) {
  if (!authorized(req)) return deny()
  const db = await readDb()
  return Response.json(Object.fromEntries(Object.entries(db).map(([id, v]) => [id, { last4: v.key.slice(-4), code: v.code }])))
}

export async function POST(req: Request) {
  if (!authorized(req)) return deny()
  const body = (await req.json().catch(() => ({}))) as { factoryId?: string; apiKey?: string }
  if (!body.factoryId || !body.apiKey?.trim()) return Response.json({ error: 'اطلاعات ناقص است.' }, { status: 400 })
  return Response.json({ code: await saveKey(body.factoryId, body.apiKey.trim()) })
}
