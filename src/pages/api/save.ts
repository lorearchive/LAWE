import type { APIRoute } from "astro";
import { auth } from "../../utils/auth";
import { savePage } from "../../utils/octo";

export const POST: APIRoute = async ({ request }) => {

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });

    const body = await request.json();
    
    try {

        await savePage(body.path, body.content, body.sha);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to save" }), { status: 500 });
    }
};