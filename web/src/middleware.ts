import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdmin } from "@/lib/access";
import { matchCheckedRoute, routeExists } from "@/lib/route-exists";
import { SESSION_COOKIE, readSessionToken } from "@/lib/session";

const PUBLIC = ["/auth", "/api/auth/login", "/api/auth/register", "/api/auth/demo"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname === "/favicon.ico" ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".webmanifest") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js"
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await readSessionToken(token);

  if (!session && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (session && pathname === "/auth") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const needsAdmin = pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin");
  if (session && needsAdmin && !isAdmin(session)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Real HTTP 404 for missing people / agencies / events (see lib/route-exists.ts for why
  // this cannot be left to notFound() inside the page). Client-side navigations (RSC /
  // prefetch) are left to the page's own not-found UI.
  if (session && (req.method === "GET" || req.method === "HEAD") && !req.headers.has("rsc") && !req.headers.has("next-router-prefetch")) {
    const check = matchCheckedRoute(pathname);
    if (check) {
      if (check.kind === "people" && check.key === "lebedeva") {
        const url = req.nextUrl.clone();
        url.pathname = "/people/kevorkova";
        return NextResponse.redirect(url, 308);
      }
      if ((await routeExists(check)) === false) {
        return NextResponse.rewrite(new URL("/_not-found-kadr", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
  // Node.js runtime: the existence checks above query Postgres (postgres-js needs TCP sockets).
  runtime: "nodejs",
};
