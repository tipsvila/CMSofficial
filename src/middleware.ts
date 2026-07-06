import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/")) {
    const fwd = request.headers.get("x-forwarded-for")
    const ip = fwd?.split(",")[0]?.trim() || "unknown"

    const cfg = pathname.includes("/init")
      ? RATE_LIMITS.init
      : pathname.includes("delete") || pathname === "/api/settings"
        ? RATE_LIMITS.write
        : RATE_LIMITS.api

    const result = checkRateLimit(`mw:${cfg.windowMs}:${ip}:${pathname}`, cfg)

    if (!result.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) } }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
