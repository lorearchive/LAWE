import { betterAuth } from "better-auth"
import { Pool } from "pg"
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
            scope: ["user:email"]
        }
    },
    advanced: {
        useSecureCookies: true
    }
})

