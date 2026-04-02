import type { APIRoute } from "astro";
import { auth } from "../../utils/auth";
import { savePage } from "../../utils/octo";

export const POST: APIRoute = async ({ request }) => {

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });

    const { path, content, sha } = await request.json();
    
    try {
        await savePage(request, path, content, sha);
        return new Response("Success", { status: 200 });
    } catch (e) {
        return new Response("Failed to commit", { status: 500 });
    }
}