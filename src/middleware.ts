import { auth } from "./utils/auth";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    const isDashboard = context.url.pathname.startsWith("/dashboard");

    if (isDashboard) {
        const session = await auth.api.getSession({
        headers: context.request.headers,
        });

        if (!session) {
        return context.redirect("/signin");
        }

    }

    return next();
    });