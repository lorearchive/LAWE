import { Octokit } from "octokit"
import { auth } from "./auth"
import Database from "better-sqlite3"

const sqlite = new Database("sessions.db")

const octokit = new Octokit({ auth: process.env.GITHUB_PAT })
const OWNER = "lorearchive"
const REPO = "law-content"

export async function getAuthenticatedOctokit(request: Request) {

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) throw new Error("Unauthorized");

    const account = sqlite.prepare(
        `SELECT access_token FROM account
         WHERE user_id = ? AND provider_id = 'github'
         LIMIT 1`
    ).get(session.user.id) as { access_token: string } | undefined

    if (!account?.access_token) throw new Error("No GitHub token found")

        return new Octokit({ auth: account.access_token })
}

export async function getPages(path: string) {
    try {
        const { data } = await octokit.rest.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: path,
        })

        if ('content' in data) {
            return {
                content: Buffer.from(data.content, 'base64').toString('utf-8'),
                sha: data.sha
            }
        }
    } catch (e) {
        return null
    }
}

export async function savePage(path: string, content: string, sha: string) {
    await octokit.rest.repos.createOrUpdateFileContents({
        owner: OWNER,
        repo: REPO,
        path: path,
        message: `chore(wiki): update ${path} via web editor`,
        content: Buffer.from(content).toString('base64'),
        sha: sha
    })
}