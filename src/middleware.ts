import { defineMiddleware } from "astro:middleware";
import { auth } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (pathname.startsWith("/api/auth/")) return next();

  const result = await auth.api.getSession({ headers: context.request.headers });
  context.locals.user = result?.user ?? null;

  if (context.locals.user || pathname === "/login") return next();

  if (pathname.startsWith("/api/")) {
    return new Response("Non authentifié", { status: 401 });
  }
  return context.redirect("/login");
  });