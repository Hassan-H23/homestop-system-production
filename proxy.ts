import { clerkMiddleware } from "@clerk/nextjs/server";

const protectedRoutes = [
  "/",
  "/dashboard",
  "/employees",
  "/orders",
  "/product_inventory",
  "/raw_material_inventory",
  "/sales",
  "/settings",
  "/statistics",
];

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtectedRoute) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
