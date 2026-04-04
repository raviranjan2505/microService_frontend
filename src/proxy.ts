import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/account", "/checkout"];
const authRoutes = ["/login-in", "/sign-up"];

export function proxy(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;
  const { pathname } = req.nextUrl;
  const hasSession = !!(accessToken || refreshToken);

  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !hasSession) {
    return NextResponse.redirect(new URL("/login-in", req.url));
  }

  if (authRoutes.some((route) => pathname.startsWith(route)) && hasSession) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*", "/login-in", "/sign-up"],
};
