import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/products/:path*",
    "/inventory/:path*",
    "/sales/:path*",
    "/pos/:path*",
    "/customers/:path*",
    "/suppliers/:path*",
    "/purchase-orders/:path*",
    "/goods-receipts/:path*",
    "/expenses/:path*",
    "/payments/:path*",
    "/approvals/:path*",
    "/reports/:path*",
    "/notifications/:path*",
    "/audit-logs/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/users/:path*",
    "/roles-permissions/:path*",
    "/branches/:path*",
    "/warehouses/:path*",
    "/categories/:path*",
    "/batches-expiry/:path*",
    "/returns/:path*",
    "/admin/:path*",
    "/search/:path*",
  ],
};
