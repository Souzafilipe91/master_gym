import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Verifica se uma URI é um deep link válido do app mobile Master Gym.
 * Schemes permitidos: mastergym://
 */
function isMobileDeepLink(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    return parsed.protocol === "mastergym:";
  } catch {
    return false;
  }
}

/**
 * Extrai o redirectUri do parâmetro state (base64).
 * O state é gerado pelo cliente como btoa(redirectUri).
 */
function decodeStateToRedirectUri(state: string): string | null {
  try {
    return atob(state);
  } catch {
    return null;
  }
}

export function registerOAuthRoutes(app: Express) {
  /**
   * Rota de callback OAuth.
   *
   * Suporta dois fluxos:
   * 1. Web: redireciona para "/" após autenticar
   * 2. Mobile: redireciona para mastergym://auth/callback?session=ok
   *
   * O fluxo mobile é ativado quando o state contém um deep link mobile
   * (ex: btoa("mastergym://auth/callback")).
   */
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // Decodifica o state para obter o redirectUri original
    const redirectUri = decodeStateToRedirectUri(state);
    const isMobile = redirectUri ? isMobileDeepLink(redirectUri) : false;

    console.log(`[OAuth] Callback recebido | mobile: ${isMobile} | redirectUri: ${redirectUri ?? "n/a"}`);

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);

      if (isMobile && redirectUri) {
        // Fluxo Mobile: seta o cookie e redireciona para o deep link do app
        // O cookie será enviado junto com o redirect para que o WebView/browser
        // o armazene antes de abrir o app.
        // O app recebe o deep link e chama /api/trpc/auth.me para confirmar a sessão.
        res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
          // Para mobile, usamos sameSite: "none" e secure para compatibilidade
          // com browsers móveis que abrem a URL de callback
          sameSite: "none",
          secure: true,
        });

        // Redireciona para o deep link: mastergym://auth/callback?session=ok
        const deepLinkUrl = new URL(redirectUri);
        deepLinkUrl.searchParams.set("session", "ok");
        deepLinkUrl.searchParams.set("user", encodeURIComponent(userInfo.name || ""));

        console.log(`[OAuth] Redirecionando para deep link mobile: ${deepLinkUrl.toString()}`);
        res.redirect(302, deepLinkUrl.toString());
      } else {
        // Fluxo Web: comportamento original
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        res.redirect(302, "/");
      }
    } catch (error) {
      console.error("[OAuth] Callback failed", error);

      if (isMobile && redirectUri) {
        // Em caso de erro no fluxo mobile, redireciona com parâmetro de erro
        const deepLinkUrl = new URL(redirectUri);
        deepLinkUrl.searchParams.set("session", "error");
        deepLinkUrl.searchParams.set("message", "auth_failed");
        res.redirect(302, deepLinkUrl.toString());
      } else {
        res.status(500).json({ error: "OAuth callback failed" });
      }
    }
  });

  /**
   * Rota para gerar a URL de login OAuth para o app mobile.
   * O app mobile chama esta rota para obter a URL de login com o deep link
   * correto como redirectUri.
   *
   * GET /api/oauth/mobile-login-url?redirect_uri=mastergym://auth/callback
   */
  app.get("/api/oauth/mobile-login-url", (req: Request, res: Response) => {
    const mobileRedirectUri = getQueryParam(req, "redirect_uri");

    if (!mobileRedirectUri || !isMobileDeepLink(mobileRedirectUri)) {
      res.status(400).json({
        error: "redirect_uri inválido. Use um deep link mobile (ex: mastergym://auth/callback)",
      });
      return;
    }

    // O state é o base64 do redirectUri mobile
    // O OAuth portal vai usar esse state para redirecionar de volta
    const state = btoa(mobileRedirectUri);

    // Obtém as variáveis de ambiente necessárias
    const oauthPortalUrl = process.env.VITE_OAUTH_PORTAL_URL;
    const appId = process.env.VITE_APP_ID;

    if (!oauthPortalUrl || !appId) {
      res.status(500).json({ error: "OAuth não configurado no servidor" });
      return;
    }

    // Monta a URL de login OAuth com o redirectUri apontando para o callback do backend
    // O backend irá redirecionar para o deep link mobile após autenticar
    const callbackUrl = `${req.protocol}://${req.get("host")}/api/oauth/callback`;
    const loginUrl = new URL(`${oauthPortalUrl}/app-auth`);
    loginUrl.searchParams.set("appId", appId);
    loginUrl.searchParams.set("redirectUri", callbackUrl);
    loginUrl.searchParams.set("state", state);
    loginUrl.searchParams.set("type", "signIn");

    console.log(`[OAuth] URL de login mobile gerada: ${loginUrl.toString()}`);

    res.json({
      loginUrl: loginUrl.toString(),
      state,
      callbackUrl,
    });
  });
}
