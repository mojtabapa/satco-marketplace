import { generateText } from 'ai'
import { resolveFactoryKey } from '@/lib/ai-keys'

export const maxDuration = 60

const GATEWAY_MODEL = 'google/gemini-2.5-flash-image'
const GEMINI_DIRECT_MODEL = 'gemini-2.5-flash-image'
const MAX_IMAGE_BYTES = 6 * 1024 * 1024

type Surface = 'floor' | 'wall' | 'both'

interface VisualizeBody {
  roomImage?: string
  tileImage?: string
  tileName?: string
  tileSize?: string
  surface?: Surface
}

const SURFACE_TEXT: Record<Surface, string> = {
  floor: 'the FLOOR only',
  wall: 'the main WALLS only',
  both: 'both the FLOOR and the main WALLS',
}

function parseDataUrl(value: string | undefined) {
  if (!value) return null
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(value)
  if (!match) return null
  const bytes = Math.floor((match[2].length * 3) / 4)
  if (bytes > MAX_IMAGE_BYTES) return null
  return { mediaType: match[1] === 'image/jpg' ? 'image/jpeg' : match[1], base64: match[2] }
}

function buildPrompt(surface: Surface, tileName?: string, tileSize?: string) {
  return [
    `You are an interior visualization tool. Re-tile ${SURFACE_TEXT[surface]} of the room in the FIRST image`,
    'using the tile shown in the SECOND image.',
    tileName ? `Tile name: ${tileName}.` : '',
    tileSize ? `Tile size: ${tileSize} cm — keep realistic scale and perspective-correct grout lines.` : '',
    'Preserve the room geometry, furniture, lighting, shadows, reflections and camera angle exactly.',
    'Do not add or remove objects. Output a single photorealistic image.',
  ]
    .filter(Boolean)
    .join(' ')
}

async function generateWithGeminiKey(apiKey: string, prompt: string, room: { mediaType: string; base64: string }, tile: { mediaType: string; base64: string }) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_DIRECT_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: room.mediaType, data: room.base64 } },
              { inline_data: { mime_type: tile.mediaType, data: tile.base64 } },
            ],
          },
        ],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    },
  )
  if (!res.ok) throw new Error(`Gemini API error ${res.status}`)
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] } }[]
  }
  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
  return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : null
}

async function generateWithGateway(prompt: string, room: { mediaType: string; base64: string }, tile: { mediaType: string; base64: string }) {
  const result = await generateText({
    model: GATEWAY_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'file', mediaType: room.mediaType, data: room.base64 },
          { type: 'file', mediaType: tile.mediaType, data: tile.base64 },
        ],
      },
    ],
  })
  const image = result.files.find((f) => f.mediaType.startsWith('image/'))
  return image ? `data:${image.mediaType};base64,${image.base64}` : null
}

export async function POST(req: Request) {
  let body: VisualizeBody
  try {
    body = (await req.json()) as VisualizeBody
  } catch {
    return Response.json({ error: 'درخواست نامعتبر است.' }, { status: 400 })
  }

  const room = parseDataUrl(body.roomImage)
  const tile = parseDataUrl(body.tileImage)
  if (!room || !tile) {
    return Response.json({ error: 'تصویر اتاق و تصویر کاشی (PNG/JPEG/WebP تا ۶ مگابایت) الزامی است.' }, { status: 400 })
  }

  const surface: Surface = body.surface && body.surface in SURFACE_TEXT ? body.surface : 'floor'
  const prompt = buildPrompt(surface, body.tileName?.slice(0, 80), body.tileSize?.slice(0, 20))

  // اگر کارخانه با کد دسترسی وارد شده باشد، از کلید اختصاصی همان کارخانه استفاده می‌شود
  const factoryId = req.headers.get('x-factory-id')
  let factoryKey: string | null = null
  if (factoryId) {
    factoryKey = await resolveFactoryKey(factoryId, req.headers.get('x-access-code') ?? '')
    if (!factoryKey) return Response.json({ error: 'کد دسترسی هوش مصنوعی این کارخانه معتبر نیست.' }, { status: 403 })
  }

  try {
    const apiKey = factoryKey ?? process.env.GEMINI_API_KEY
    const image = apiKey
      ? await generateWithGeminiKey(apiKey, prompt, room, tile)
      : await generateWithGateway(prompt, room, tile)

    if (!image) {
      return Response.json({ error: 'مدل تصویری تولید نکرد. لطفاً تصویر دیگری امتحان کنید.' }, { status: 502 })
    }
    return Response.json({ image })
  } catch (error) {
    console.error('[visualize] generation failed', error)
    return Response.json({ error: 'خطا در ارتباط با سرویس هوش مصنوعی. دوباره تلاش کنید.' }, { status: 502 })
  }
}
