import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  dbHealth: publicProcedure.query(async () => {
    const url = process.env.DATABASE_URL;
    if (!url) return { ok: false, error: "DATABASE_URL not set" };
    try {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      await pool.end();
      return { ok: true };
    } catch (e: any) {
      return {
        ok: false,
        error: e?.message,
        code: e?.code,
        errno: e?.errno,
        syscall: e?.syscall,
        address: e?.address,
        port: e?.port,
      };
    }
  }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
