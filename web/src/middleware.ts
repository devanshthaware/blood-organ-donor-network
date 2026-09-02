import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/donor(.*)",
  "/hospital(.*)",
  "/admin(.*)",
]);

const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const handler = hasClerkKey
  ? clerkMiddleware(async (auth, req) => {
      try {
        if (isProtectedRoute(req) && process.env.CLERK_SECRET_KEY) {
          await auth.protect();
        }
      } catch {
        return NextResponse.next();
      }
    })
  : (req: NextRequest) => {
      return NextResponse.next();
    };

export default handler;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
