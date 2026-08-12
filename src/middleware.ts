import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const isProtected = request.nextUrl.pathname.startsWith("/worlds") || 
                      request.nextUrl.pathname.startsWith("/sessions") || 
                      request.nextUrl.pathname.startsWith("/personas");
                      
  if (isProtected) {
    return auth.middleware({ loginUrl: "/login" })(request);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
