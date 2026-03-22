/**
 * Users API routes (CHK-055)
 * DELETE /api/v1/users/me — account deletion
 */
import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { deleteAccount } from "@/server/services/profile-service";

type Env = { Variables: { session: { user: { id: string; email: string; name?: string } } | null } };

const router = new Hono<Env>();

router.use("*", requireAuth);

// DELETE /api/v1/users/me — delete account + all data (cascade)
router.delete("/me", async (c) => {
  const userId = c.get("session")!.user.id;
  await deleteAccount(userId);
  return c.body(null, 204);
});

export { router as users };
