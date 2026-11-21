import 'server-only'
import { promises as fs } from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'

// کلید هوش مصنوعی هر کارخانه فقط روی سرور و در .data/ai-keys.json نگهداری می‌شود.
const FILE = path.join(process.cwd(), '.data', 'ai-keys.json')
type Db = Record<string, { key: string; code: string }>

export async function readDb(): Promise<Db> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as Db
  } catch {
    return {}
  }
}

export async function saveKey(factoryId: string, key: string) {
  const db = await readDb()
  db[factoryId] = { key, code: db[factoryId]?.code ?? randomBytes(6).toString('hex') }
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  await fs.writeFile(FILE, JSON.stringify(db, null, 1))
  return db[factoryId].code
}

export async function resolveFactoryKey(factoryId: string, code: string) {
  const entry = (await readDb())[factoryId]
  return entry && entry.code === code ? entry.key : null
}
