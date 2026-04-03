import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";
import { auth } from "./auth";

const OWNER = "lorearchive";
const REPO = "law-content";

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

export async function verifySession(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) throw new Error("Unauthorized");
    return session;
}

export async function getPage(path: string) {
    try {
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

    const session = await verifySession(request);
    const appOctokit = await getAppOctokit();

    return await appOctokit.rest.repos.createOrUpdateFileContents({
        owner: OWNER,
        repo: REPO,
        path: path,
        message: `${session.user.email} edited ${path} via web editor`,
        content: Buffer.from(content).toString('base64'),
        sha: sha,
        author: {
            name: session.user.name,
            email: session.user.email
        }
    });
}