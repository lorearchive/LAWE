import { Octokit } from "octokit"
import { auth } from "./auth" // Your Better Auth + Neon config
import {Pool} from "pg"


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});

const OWNER = "lorearchive"
const REPO = "law-content"

/**
 * Gets an Octokit instance tied to the LOGGED-IN user.
 * This ensures the user's GitHub account gets credit for the commit.
 */
export async function getAuthenticatedOctokit(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) throw new Error("Unauthorized");

    // Query Neon for the GitHub access token
    const result = await pool.query(
        `SELECT "accessToken" FROM account 
         WHERE "userId" = $1 AND "providerId" = 'github' 
         LIMIT 1`,
        [session.user.id]
    );

    const accessToken = result.rows[0]?.accessToken;
    if (!accessToken) throw new Error("No GitHub token found in database");

    return new Octokit({ auth: accessToken });
}

export async function getPage(request: Request, path: string) {
    const userOctokit = await getAuthenticatedOctokit(request);
    
    try {
        const { data } = await userOctokit.rest.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: path,
        });

        if ('content' in data && !Array.isArray(data)) {
            return {
                content: Buffer.from(data.content, 'base64').toString('utf-8'),
                sha: data.sha
            };
        }
        return null;
    } catch (e) {
        console.error("GitHub Fetch Error:", e);
        return null;
    }
}


export async function savePage(request: Request, path: string, content: string, sha: string) {
    const userOctokit = await getAuthenticatedOctokit(request);

    return await userOctokit.rest.repos.createOrUpdateFileContents({
        owner: OWNER,
        repo: REPO,
        path: path,
        message: `lore(wiki): edit ${path}`,
        content: Buffer.from(content).toString('base64'),
        sha: sha
    });
}