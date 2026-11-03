import { NextResponse, type NextRequest } from "next/server";

// Бірінші сүзгі: cookie жоқ болса, жабық беттерден бірден кіру бетіне жібереміз.
// Нақты тексеріс (сессия, рөл) әр беттің және әрекеттің серверлік кодында жасалады.
const PROTECTED = ["/dashboard", "/favorites", "/profile", "/settings", "/admin", "/notifications"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/")) && !req.cookies.get("ih_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|api/files|favicon.ico).*)"] };
