import { NextResponse, type NextRequest } from 'next/server'

// مسیرهای عمومی (بدون نیاز به لاگین)
const PUBLIC_PATHS = ['/login']

// مسیرهای نیازمند لاگین
const PROTECTED_PATHS = ['/market', '/panel', '/admin', '/factories', '/products', '/visualizer']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // اگه مسیر عمومی بود، بذار رد بشه
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // چک کن اگه کاربر لاگین هست یا نه (از localStorage اینجا نمیشه خوند، پس از cookie استفاده می‌کنیم)
  const session = request.cookies.get('satco-session')?.value

  // اگه مسیر محافظت‌شده بود و کاربر لاگین نکرده بود، بفرست به /login
  if (PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    if (!session) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  // اگه کاربر لاگین کرده و داره می‌ره /login، بفرست به /market
  if (pathname === '/login' && session) {
    const url = request.nextUrl.clone()
    url.pathname = '/market'
    return NextResponse.redirect(url)
  }

  // اگه کاربر داره به / می‌ره (صفحه اصلی) و لاگین نکرده، بفرست به /login
  if (pathname === '/' && !session) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|tiles|images|placeholder).*)'],
}