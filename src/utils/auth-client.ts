import { createAuthClient } from "better-auth/client"

export const authClient = createAuthClient({
    baseURL: typeof window !== "undefined" ? import.meta.env.BETTER_AUTH_URL : "" 
});