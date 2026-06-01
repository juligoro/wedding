import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, ADMIN_LOGIN_PATH, verifyAdminSession } from "@/lib/adminAuth";

const PUBLIC_ADMIN_PATHS = new Set([ADMIN_LOGIN_PATH, "/api/admin/login"]);

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ADMIN_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const isAuthenticated = await verifyAdminSession(request.cookies.get(ADMIN_COOKIE_NAME)?.value);

  if (isAuthenticated) {
    return NextResponse.next();
  }

  if (isAdminApi) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);

  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
