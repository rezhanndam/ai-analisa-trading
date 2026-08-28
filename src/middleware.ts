import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// In-memory rate limiter (per Section 39: API rate limiting)
// Catatan: in-memory, reset tiap restart server. Untuk multi-instance pakai Redis/DB.
const WINDOW_MS = 60 * 1000
const MAX_REQUESTS = 60

const hits = new Map<string, { count: number; resetAt: number }>()

function rateLimit(key: string): boolean {
  const now = Date.now()
  const entry = hits.get(key)
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  entry.count++
  return entry.count <= MAX_REQUESTS
}

const PUBLIC_PATHS = ["/login", "/api/auth"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rate limit API
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const key = `${ip}:${pathname}`

    if (!rateLimit(key)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Coba lagi nanti." },
        { status: 429 }
      )
    }
  }

  // Auth guard: halaman non-API wajib login
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (!isPublic) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}
