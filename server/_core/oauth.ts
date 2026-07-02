import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

export function registerOAuthRoutes(app: Express) {
  // Login de desenvolvimento — só funciona quando NODE_ENV=development
  app.get("/api/auth/dev-login", async (req: Request, res: Response) => {
    if (ENV.isProduction) {
      res.status(403).json({ error: "Disponível apenas em desenvolvimento" });
      return;
    }

    const devOpenId = "dev:local-user";
    const devName = "Filipe (Dev)";
    const devEmail = "dev@localhost";

    await db.upsertUser({
      openId: devOpenId,
      name: devName,
      email: devEmail,
      loginMethod: "email",
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(devOpenId, {
      name: devName,
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.redirect(302, "/");
  });
}
