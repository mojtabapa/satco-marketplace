import type {
  AdEvent,
  AdPricing,
  AdSlot,
  Factory,
  Product,
  PurchaseRequest,
  StockPoint,
  UploadLog,
} from './types'

export const DEMO_OTP = '12345'
export const ADMIN_PHONE = '09120000000'

export const TILE_TEXTURES = [
  { key: 'calacatta', url: '/tiles/calacatta.png', color: '#e9e4dc', label: 'مرمر کالاکاتا' },
  { key: 'nero', url: '/tiles/nero.png', color: '#1d1c1b', label: 'مشکی نرو' },
  { key: 'travertine', url: '/tiles/travertine.png', color: '#d8c4a2', label: 'تراورتن' },
  { key: 'concrete', url: '/tiles/concrete.png', color: '#8d8b87', label: 'طرح بتن' },
  { key: 'wood', url: '/tiles/wood.png', color: '#a8774a', label: 'طرح چوب' },
  { key: 'turquoise', url: '/tiles/turquoise.png', color: '#2d8a9a', label: 'فیروزه‌ای' },
  { key: 'terrazzo', url: '/tiles/terrazzo.png', color: '#e6dfd4', label: 'ترازو' },
  { key: 'onyx', url: '/tiles/onyx.png', color: '#5f8a5a', label: 'اونیکس سبز' },
] as const

export const SIZES = ['30×60', '60×60', '60×120', '80×80', '20×120', '25×40'] as const
export const GRADES = ['درجه ۱', 'درجه ۲', 'درجه ۳', 'درجه ۴', 'درجه ۵', 'درجه ۶'] as const

export const initialFactories: Factory[] = [
  {
    id: 'f1',
    userId: 'u_f1',
    name: 'کاشی و سرامیک آریا',
    type: 'factory',
    approved: true,
    registrationNumber: '۱۲۴۵۸',
    logoUrl: null,
    slogan: 'کیفیت در هر متر، هنر در هر خانه',
    brandColor: '#d9b45a',
    phone: '09131234567',
    address: 'یزد، شهرک صنعتی اردکان، بلوار کاشی، پلاک ۱۴',
    city: 'یزد',
    description:
      'تولیدکننده‌ی پرسلان و سرامیک کف با ظرفیت سالانه‌ی ۸ میلیون متر مربع. تخصص در طرح‌های مرمری و اسلب‌های بزرگ.',
    createdAt: '2025-03-12T08:00:00.000Z',
  },
  {
    id: 'f2',
    userId: 'u_f2',
    name: 'کاشی کویر',
    type: 'factory',
    approved: true,
    registrationNumber: '۹۸۷۱',
    logoUrl: null,
    slogan: 'اصالت کویر در خانه‌ی شما',
    brandColor: '#b8663a',
    phone: '09137654321',
    address: 'یزد، میبد، جاده‌ی اردکان، کیلومتر ۵',
    city: 'میبد',
    description: 'بیش از ۲۵ سال سابقه در تولید کاشی دیوار و سرامیک‌های لعاب‌دار سنتی ایرانی.',
    createdAt: '2025-05-02T08:00:00.000Z',
  },
  {
    id: 'f3',
    userId: 'u_f3',
    name: 'بازرگانی پارس استون',
    type: 'trader',
    approved: true,
    registrationNumber: '۴۵۱۲۳',
    logoUrl: null,
    slogan: 'تأمین‌کننده‌ی برترین برندهای ایران',
    brandColor: '#5f8a5a',
    phone: '09121112233',
    address: 'تهران، خیابان ولیعصر، بازار کاشی، طبقه‌ی دوم، واحد ۱۲',
    city: 'تهران',
    description: 'تأمین و توزیع کاشی و سرامیک از برترین کارخانه‌های کشور با ارسال سریع به سراسر ایران.',
    createdAt: '2025-07-20T08:00:00.000Z',
  },
  {
    id: 'f4',
    userId: 'u_f4',
    name: 'سرامیک البرز',
    type: 'factory',
    approved: true,
    registrationNumber: '۷۷۴۲',
    logoUrl: null,
    slogan: 'نوآوری در هر کاشی',
    brandColor: '#2d8a9a',
    phone: '09123334455',
    address: 'قزوین، شهرک صنعتی لیا، خیابان سوم',
    city: 'قزوین',
    description: 'تولید پرسلان طرح چوب و بتن با فناوری چاپ دیجیتال و لعاب مات ضدلغزش.',
    createdAt: '2025-09-01T08:00:00.000Z',
  },
  {
    id: 'f5',
    userId: 'u_f5',
    name: 'کاشی نگین میبد',
    type: 'factory',
    approved: false,
    registrationNumber: '۳۳۰۹',
    logoUrl: null,
    slogan: 'کلاسیک برای همیشه',
    brandColor: '#a87b4f',
    phone: '09135556677',
    address: 'یزد، میبد، شهرک صنعتی، فاز دو',
    city: 'میبد',
    description: 'تولید کاشی دیوار ۲۵×۴۰ و ۳۰×۶۰ با طرح‌های کلاسیک.',
    createdAt: '2026-10-28T08:00:00.000Z',
  },
  {
    id: 'f6',
    userId: 'u_f6',
    name: 'بازرگانی تیسفون',
    type: 'trader',
    approved: false,
    registrationNumber: '۶۶۱۰۲',
    logoUrl: null,
    slogan: 'پخش اسلب‌های صادراتی',
    brandColor: '#1d1c1b',
    phone: '09127778899',
    address: 'اصفهان، خیابان کاشانی، مجتمع تیسفون',
    city: 'اصفهان',
    description: 'واردات و پخش اسلب‌های پرسلان و سرامیک صادراتی.',
    createdAt: '2026-10-30T08:00:00.000Z',
  },
]

type Seed = [string, string, string, string, string, number, boolean, (typeof TILE_TEXTURES)[number]['key']]

const seeds: Seed[] = [
  ['f1', 'AR-1001', 'کالاکاتا گلد', '60×120', 'درجه ۱', 1850, true, 'calacatta'],
  ['f1', 'AR-1002', 'نرو مارکینا', '60×120', 'درجه ۱', 920, false, 'nero'],
  ['f1', 'AR-1003', 'ترازو میلانو', '60×60', 'درجه ۱', 2400, true, 'terrazzo'],
  ['f1', 'AR-1004', 'اونیکس امرالد', '80×80', 'درجه ۲', 640, false, 'onyx'],
  ['f1', 'AR-1005', 'کالاکاتا سیلور', '60×60', 'درجه ۲', 3100, true, 'calacatta'],
  ['f2', 'KV-210', 'فیروزه‌ی کویر', '25×40', 'درجه ۱', 1200, false, 'turquoise'],
  ['f2', 'KV-215', 'تراورتن یزد', '30×60', 'درجه ۱', 2750, true, 'travertine'],
  ['f2', 'KV-220', 'فیروزه‌ی کاشان', '25×40', 'درجه ۲', 860, true, 'turquoise'],
  ['f2', 'KV-231', 'تراورتن کرم', '60×60', 'درجه ۳', 4200, false, 'travertine'],
  ['f3', 'PS-77', 'نرو گلد', '80×80', 'درجه ۱', 540, true, 'nero'],
  ['f3', 'PS-81', 'بتن آنتراسیت', '60×120', 'درجه ۱', 1320, false, 'concrete'],
  ['f3', 'PS-90', 'کالاکاتا وایت', '60×120', 'درجه ۱', 780, true, 'calacatta'],
  ['f3', 'PS-95', 'ترازو رنگی', '60×60', 'درجه ۲', 1950, false, 'terrazzo'],
  ['f4', 'AL-501', 'چوب بلوط', '20×120', 'درجه ۱', 3600, true, 'wood'],
  ['f4', 'AL-502', 'چوب گردو', '20×120', 'درجه ۲', 1480, false, 'wood'],
  ['f4', 'AL-510', 'بتن طوسی', '60×60', 'درجه ۱', 5200, true, 'concrete'],
  ['f4', 'AL-511', 'بتن طوسی ضدلغزش', '30×60', 'درجه ۱', 2100, false, 'concrete'],
  ['f4', 'AL-520', 'تراورتن رومی', '60×120', 'درجه ۳', 380, true, 'travertine'],
  ['f5', 'NG-01', 'کلاسیک کرم', '25×40', 'درجه ۱', 900, false, 'travertine'],
  ['f6', 'TS-10', 'اسلب نرو', '80×80', 'درجه ۱', 450, true, 'nero'],
]

export const initialProducts: Product[] = seeds.map(
  ([factoryId, code, name, size, grade, stockM2, isCash, texture], index) => {
    const tex = TILE_TEXTURES.find((t) => t.key === texture)!
    return {
      id: `p${index + 1}`,
      factoryId,
      code,
      name,
      size,
      grade,
      stockM2,
      isCash,
      imageUrl: tex.url,
      color: tex.color,
      updatedAt: new Date(Date.UTC(2026, 9, 31 - (index % 4), 6, 30)).toISOString(),
    }
  },
)

export const initialUploadLogs: UploadLog[] = [
  { id: 'ul1', factoryId: 'f1', filename: 'mojodi-1405-08-08.xlsx', rowsUpdated: 4, rowsCreated: 1, rowsFailed: 0, createdAt: '2026-10-30T07:10:00.000Z' },
  { id: 'ul2', factoryId: 'f1', filename: 'mojodi-1405-08-07.xlsx', rowsUpdated: 5, rowsCreated: 0, rowsFailed: 2, createdAt: '2026-10-29T07:05:00.000Z' },
  { id: 'ul3', factoryId: 'f1', filename: 'mojodi-1405-08-06.csv', rowsUpdated: 3, rowsCreated: 2, rowsFailed: 0, createdAt: '2026-10-28T06:58:00.000Z' },
]

export const initialRequests: PurchaseRequest[] = [
  { id: 'r1', productId: 'p1', factoryId: 'f1', buyerPhone: '09351234567', buyerName: 'شرکت ساختمانی نوین', quantityM2: 450, note: 'برای پروژه‌ی برج مسکونی، تحویل تهران', createdAt: '2026-10-31T05:20:00.000Z', status: 'new' },
  { id: 'r2', productId: 'p3', factoryId: 'f1', buyerPhone: '09129876543', buyerName: 'فروشگاه کاشی رضایی', quantityM2: 120, note: '', createdAt: '2026-10-30T11:45:00.000Z', status: 'contacted' },
  { id: 'r3', productId: 'p5', factoryId: 'f1', buyerPhone: '09901112233', buyerName: 'علی محمدی', quantityM2: 60, note: 'آیا امکان ارسال به شیراز هست؟', createdAt: '2026-10-29T09:10:00.000Z', status: 'done' },
  { id: 'r4', productId: 'p2', factoryId: 'f1', buyerPhone: '09185554433', buyerName: 'پیمانکاری آسمان', quantityM2: 300, note: '', createdAt: '2026-10-28T14:00:00.000Z', status: 'new' },
  { id: 'r5', productId: 'p7', factoryId: 'f2', buyerPhone: '09351112222', buyerName: 'مهندس کریمی', quantityM2: 200, note: '', createdAt: '2026-10-30T10:00:00.000Z', status: 'new' },
]

export const adPricing: AdPricing[] = [
  { slotName: 'home_hero', label: 'بنر صفحه‌ی اصلی', description: 'نمایش در بالای صفحه‌ی خوش‌آمدگویی', pricePerDay: 2_500_000 },
  { slotName: 'market_top', label: 'بالای بازار', description: 'بنر افقی بالای لیست محصولات بازار', pricePerDay: 1_800_000 },
  { slotName: 'market_featured', label: 'محصول ویژه', description: 'نمایش کارت محصول با برچسب ویژه در ابتدای بازار', pricePerDay: 900_000 },
  { slotName: 'factory_spotlight', label: 'کارخانه‌ی منتخب', description: 'معرفی برند در بخش کارخانه‌های منتخب', pricePerDay: 1_200_000 },
]

export const initialAdSlots: AdSlot[] = [
  { id: 'ad1', factoryId: 'f1', slotName: 'market_top', startDate: '2026-10-25', endDate: '2026-11-08', amount: 27_000_000, status: 'paid' },
  { id: 'ad2', factoryId: 'f4', slotName: 'factory_spotlight', startDate: '2026-10-20', endDate: '2026-11-03', amount: 18_000_000, status: 'paid' },
  { id: 'ad3', factoryId: 'f3', slotName: 'home_hero', startDate: '2026-10-28', endDate: '2026-11-07', amount: 27_500_000, status: 'paid' },
  { id: 'ad4', factoryId: 'f2', slotName: 'market_featured', startDate: '2026-11-02', endDate: '2026-11-12', amount: 9_900_000, status: 'pending' },
  { id: 'ad5', factoryId: 'f1', slotName: 'home_hero', startDate: '2026-09-10', endDate: '2026-09-20', amount: 27_500_000, status: 'paid' },
]

function buildEvents(): AdEvent[] {
  const slots = ['market_top', 'factory_spotlight', 'home_hero']
  const events: AdEvent[] = []
  for (let i = 0; i < 36; i++) {
    const slotName = slots[i % slots.length]
    const hour = 23 - (i % 24)
    events.push({
      id: `ev${i}`,
      type: i % 5 === 0 ? 'clk' : 'imp',
      slotName,
      createdAt: new Date(Date.UTC(2026, 9, 31 - Math.floor(i / 12), hour, (i * 7) % 60)).toISOString(),
    })
  }
  return events
}

export const initialEvents: AdEvent[] = buildEvents()

function buildHistory(): StockPoint[] {
  const points: StockPoint[] = []
  const bases: Record<string, number> = { f1: 7600, f2: 8400, f3: 4200, f4: 12300 }
  for (const [factoryId, base] of Object.entries(bases)) {
    for (let d = 13; d >= 0; d--) {
      const wave = Math.round(Math.sin((d + base / 1000) * 0.9) * base * 0.08)
      points.push({
        factoryId,
        date: new Date(Date.UTC(2026, 9, 31 - d)).toISOString(),
        total: base + wave + (13 - d) * 40,
      })
    }
  }
  return points
}

export const initialStockHistory: StockPoint[] = buildHistory()