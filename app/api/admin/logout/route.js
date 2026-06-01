import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, getAdminCookieOptions } from "@/lib/adminAuth";

export async function POST(request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url), 303);

  response.cookies.set(ADMIN_COOKIE_NAME, "", { ...getAdminCookieOptions(), maxAge: 0 });

  return response;
}
