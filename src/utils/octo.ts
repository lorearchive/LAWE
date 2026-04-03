import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";
import { auth } from "./auth";

const OWNER = "lorearchive";
const REPO = "law-content";

/**
 * NEW: Gets an Octokit instance authorized for the specific 
 * LoreArchive installation.
 */
export async function getAppOctokit() {
    return new Octokit({
        authStrategy: createAppAuth,
        auth: {
            appId: import.meta.env.GITHUB_APP_ID,
            privateKey: import.meta.env.GITHUB_PRIVATE_KEY,
            installationId: import.meta.env.GITHUB_APP_INSTALLATION_ID,
        },
    });
}

// Helper to verify the user is logged in before allowing a save
async function verifySession(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) throw new Error("Unauthorized");
    return session;
}

export async function getPage(path: string) {
    try {
        // App-level octokit can read public/private repos it's installed on
        const appOctokit = await getAppOctokit();
        
        const { data } = await appOctokit.rest.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: path.replace(/^\//, ''),
        });

        if ('content' in data && !Array.isArray(data)) {
            return {
                content: Buffer.from(data.content, 'base64').toString('utf-8'),
                sha: data.sha
            };
        }
        return null;
    } catch (e: any) {
        console.error("Fetch Error:", e.message);
        return null;
    }
}

export async function savePage(request: Request, path: string, content: string, sha: string) {
    // 1. Verify the person hitting the API is actually logged in
    const session = await verifySession(request);

    // 2. Use the App's permission to perform the write
    const appOctokit = await getAppOctokit();

    return await appOctokit.rest.repos.createOrUpdateFileContents({
        owner: OWNER,
        repo: REPO,
        path: path,
        // We can still attribute the commit to the user in the message!
        message: `Web Editor: edit ${path} by ${session.user.email}`,
        content: Buffer.from(content).toString('base64'),
        sha: sha,
        // Optional: Make the user the "author" so their avatar shows up
        author: {
            name: session.user.name,
            email: session.user.email
        }
    });
}