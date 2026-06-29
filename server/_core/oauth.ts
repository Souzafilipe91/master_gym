import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function isMobileDeepLink(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    return parsed.protocol === "mastergym:";
  } catch {
    return false;
  }
}

function decodeStateToRedirectUri(state: string): string | null {
  try {
    return atob(state);
  } catch {
    return null;
  }
}

function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: ENV.googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function exchangeGoogleCode(code: string, redirectUri: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }
  return res.json() as Promise<{ access_token: string; id_token: string }>;
}

async function getGoogleUserInfo(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Google user info");
  return res.json() as Promise<{
    id: string;
    email: string;
    name: string;
    picture?: string;
  }>;
}

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
      loginMethod: "google",
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(devOpenId, {
      name: devName,
      expiresInMs: ONE_YEAR_MS,
    });

    res.cookie(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
      maxAge: ONE_YEAR_MS,
    });
    res.redirect(302, "/");
  });

  // Inicia login com Google
  app.get("/api/auth/google", (req: Request, res: Response) => {
    if (!ENV.googleClientId) {
      res.status(500).json({ error: "GOOGLE_CLIENT_ID não configurado" });
      return;
    }

    const mobileRedirectUri = getQueryParam(req, "redirect_uri");
    const isMobile = mobileRedirectUri ? isMobileDeepLink(mobileRedirectUri) : false;

    const state = isMobile && mobileRedirectUri ? btoa(mobileRedirectUri) : btoa("/");
    const callbackUrl = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;

    res.redirect(302, buildGoogleAuthUrl(callbackUrl, state));
  });

  // Callback do Google OAuth
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code) {
      res.status(400).json({ error: "Código de autorização não recebido" });
      return;
    }

    const redirectUri = state ? decodeStateToRedirectUri(state) : "/";
    const isMobile = redirectUri ? isMobileDeepLink(redirectUri) : false;
    const callbackUrl = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;

    try {
      const tokens = await exchangeGoogleCode(code, callbackUrl);
      const googleUser = await getGoogleUserInfo(tokens.access_token);

      await db.upsertUser({
        openId: `google:${googleUser.id}`,
        name: googleUser.name || null,
        email: googleUser.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(`google:${googleUser.id}`, {
        name: googleUser.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);

      if (isMobile && redirectUri) {
        res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
          sameSite: "none",
          secure: true,
        });
        const deepLinkUrl = new URL(redirectUri);
        deepLinkUrl.searchParams.set("session", "ok");
        deepLinkUrl.searchParams.set("user", encodeURIComponent(googleUser.name || ""));
        res.redirect(302, deepLinkUrl.toString());
      } else {
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        res.redirect(302, "/");
      }
    } catch (error) {
      console.error("[OAuth] Google callback failed", error);

      if (isMobile && redirectUri) {
        const deepLinkUrl = new URL(redirectUri);
        deepLinkUrl.searchParams.set("session", "error");
        res.redirect(302, deepLinkUrl.toString());
      } else {
        res.status(500).json({ error: "Falha na autenticação com Google" });
      }
    }
  });

  // URL de login para o app mobile
  app.get("/api/oauth/mobile-login-url", (req: Request, res: Response) => {
    const mobileRedirectUri = getQueryParam(req, "redirect_uri");

    if (!mobileRedirectUri || !isMobileDeepLink(mobileRedirectUri)) {
      res.status(400).json({ error: "redirect_uri inválido. Use um deep link mobile (ex: mastergym://auth/callback)" });
      return;
    }

    const state = btoa(mobileRedirectUri);
    const callbackUrl = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
    const loginUrl = buildGoogleAuthUrl(callbackUrl, state);

    res.json({ loginUrl, state, callbackUrl });
  });
}
