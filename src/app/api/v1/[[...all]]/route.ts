import { app } from "@/server/api";

export const runtime = "nodejs";
// Prevent Next.js from statically collecting this route (requires DATABASE_URL at runtime)
export const dynamic = "force-dynamic";

function handler(req: Request) {
  return app.fetch(req);
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
