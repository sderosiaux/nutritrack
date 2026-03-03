import { app } from "@/server/api";

export const runtime = "nodejs";

function handler(req: Request) {
  return app.fetch(req);
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
