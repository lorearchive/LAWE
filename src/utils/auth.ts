import { betterAuth } from "better-auth"
import { createAuthClient } from "better-auth/client";
import {Pool} from "pg"
import * as dotenv from "dotenv"

dotenv.config()

const pool = new Pool({
    connectionString: import.meta.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: true
    }
})


export const auth = betterAuth({
    database: pool,
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