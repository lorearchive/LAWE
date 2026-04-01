import { betterAuth } from "better-auth"
import { createAuthClient } from "better-auth/client";
import Database from "better-sqlite3"

const sqlite = new Database("./sessions.db")

export const auth = betterAuth({
    database: sqlite,
    socialProviders: {
        github: {
            clientId: import.meta.env.OAUTH_GITHUB_CLIENT_ID,
            clientSecret: import.meta.env.OAUTH_GITHUB_CLIENT_SECRET,
            scope: ["repo", "user:email"]
        }
    },
    advanced: {
        useSecureCookies: true
    }
})

export const authClient = createAuthClient({
    baseURL: import.meta.env.BETTER_AUTH_URL 
});