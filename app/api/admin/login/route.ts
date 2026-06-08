import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, createAdminSession, getAdminCookieOptions } from "@/lib/adminAuth";

function getSafeRedirect(value: unknown): string {
  return typeof value === "string" && value.startsWith("/admin") ? value : "/admin";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  const nextPath = getSafeRedirect(String(formData.get("next") || ""));
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  if (!adminPassword || password !== adminPassword) {
    return NextResponse.redirect(
      new URL(`/admin/login?error=1&next=${encodeURIComponent(nextPath)}`, request.url),
      303,
    );
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), 303);

  response.cookies.set(ADMIN_COOKIE_NAME, await createAdminSession(), getAdminCookieOptions());

  return response;
}
