import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const rol = (req.nextauth.token as any)?.rol;
    const path = req.nextUrl.pathname;

    const rutasSoloAdmin = ["/reports", "/users"];
    if (rutasSoloAdmin.some((r) => path.startsWith(r)) && rol !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/pos/:path*", "/inventory/:path*", "/shifts/:path*", "/reports/:path*", "/users/:path*", "/receipt/:path*"],
};
