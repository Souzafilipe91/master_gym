import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./registerSW";
import { restoreScheduledReminders } from "./lib/notifications";
import { initOfflineDB } from "./lib/offlineStorage";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Avoid reloading if already on the login page
  if (window.location.pathname === "/") return;

  window.location.href = "/";
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

// Aplicar tema salvo antes do primeiro render (evita flash de tema errado)
// IMPORTANTE: usa valores absolutos, sem "oklch(from ...)" que não é suportado em todos os browsers
(function initTheme() {
  try {
    const saved = localStorage.getItem("gym-theme-config");
    if (!saved) return;
    const config = JSON.parse(saved);

    type ColorMap = Record<string, string>;

    const presets: Record<string, ColorMap> = {
      "dark-red": {
        "--primary": "oklch(0.55 0.22 25)",
        "--primary-foreground": "oklch(0.98 0.005 285)",
        "--background": "oklch(0.12 0.005 285)",
        "--foreground": "oklch(0.98 0.005 285)",
        "--card": "oklch(0.15 0.005 285)",
        "--sidebar": "oklch(0.12 0.005 285)",
        "--accent": "oklch(0.55 0.22 25)",
        "--ring": "oklch(0.55 0.22 25)",
        "--secondary": "oklch(0.18 0.005 285)",
        "--secondary-foreground": "oklch(0.98 0.005 285)",
        "--muted": "oklch(0.18 0.005 285)",
        "--muted-foreground": "oklch(0.63 0.005 285)",
        "--border": "oklch(0.22 0.005 285)",
        "--input": "oklch(0.22 0.005 285)",
        "--card-foreground": "oklch(0.98 0.005 285)",
        "--popover": "oklch(0.15 0.005 285)",
        "--popover-foreground": "oklch(0.98 0.005 285)",
        "--sidebar-foreground": "oklch(0.98 0.005 285)",
        "--sidebar-primary": "oklch(0.55 0.22 25)",
        "--sidebar-primary-foreground": "oklch(0.98 0.005 285)",
        "--sidebar-accent": "oklch(0.18 0.005 285)",
        "--sidebar-accent-foreground": "oklch(0.98 0.005 285)",
        "--sidebar-border": "oklch(0.22 0.005 285)",
        "--sidebar-ring": "oklch(0.55 0.22 25)",
        "--accent-foreground": "oklch(0.98 0.005 285)",
        "--destructive": "oklch(0.65 0.25 25)",
        "--destructive-foreground": "oklch(0.98 0.005 285)",
      },
      "light-blue": {
        "--primary": "oklch(0.55 0.2 240)",
        "--primary-foreground": "oklch(0.98 0 0)",
        "--background": "oklch(0.98 0.002 240)",
        "--foreground": "oklch(0.15 0.005 240)",
        "--card": "oklch(0.95 0.003 240)",
        "--sidebar": "oklch(0.93 0.005 240)",
        "--accent": "oklch(0.55 0.2 240)",
        "--ring": "oklch(0.55 0.2 240)",
        "--secondary": "oklch(0.94 0.002 240)",
        "--secondary-foreground": "oklch(0.15 0.005 240)",
        "--muted": "oklch(0.94 0.002 240)",
        "--muted-foreground": "oklch(0.50 0.005 240)",
        "--border": "oklch(0.90 0.002 240)",
        "--input": "oklch(0.90 0.002 240)",
        "--card-foreground": "oklch(0.15 0.005 240)",
        "--popover": "oklch(0.95 0.003 240)",
        "--popover-foreground": "oklch(0.15 0.005 240)",
        "--sidebar-foreground": "oklch(0.15 0.005 240)",
        "--sidebar-primary": "oklch(0.55 0.2 240)",
        "--sidebar-primary-foreground": "oklch(0.98 0 0)",
        "--sidebar-accent": "oklch(0.89 0.005 240)",
        "--sidebar-accent-foreground": "oklch(0.15 0.005 240)",
        "--sidebar-border": "oklch(0.90 0.002 240)",
        "--sidebar-ring": "oklch(0.55 0.2 240)",
        "--accent-foreground": "oklch(0.98 0 0)",
        "--destructive": "oklch(0.55 0.22 25)",
        "--destructive-foreground": "oklch(0.98 0.005 285)",
      },
      "eva-unit1": {
        "--primary": "oklch(0.65 0.28 145)",
        "--primary-foreground": "oklch(0.1 0.02 145)",
        "--background": "oklch(0.1 0.015 290)",
        "--foreground": "oklch(0.95 0.005 290)",
        "--card": "oklch(0.14 0.02 290)",
        "--sidebar": "oklch(0.1 0.015 290)",
        "--accent": "oklch(0.65 0.28 145)",
        "--ring": "oklch(0.65 0.28 145)",
        "--secondary": "oklch(0.16 0.015 290)",
        "--secondary-foreground": "oklch(0.95 0.005 290)",
        "--muted": "oklch(0.16 0.015 290)",
        "--muted-foreground": "oklch(0.60 0.005 290)",
        "--border": "oklch(0.20 0.015 290)",
        "--input": "oklch(0.20 0.015 290)",
        "--card-foreground": "oklch(0.95 0.005 290)",
        "--popover": "oklch(0.14 0.02 290)",
        "--popover-foreground": "oklch(0.95 0.005 290)",
        "--sidebar-foreground": "oklch(0.95 0.005 290)",
        "--sidebar-primary": "oklch(0.65 0.28 145)",
        "--sidebar-primary-foreground": "oklch(0.1 0.02 145)",
        "--sidebar-accent": "oklch(0.16 0.015 290)",
        "--sidebar-accent-foreground": "oklch(0.95 0.005 290)",
        "--sidebar-border": "oklch(0.20 0.015 290)",
        "--sidebar-ring": "oklch(0.65 0.28 145)",
        "--accent-foreground": "oklch(0.1 0.02 145)",
        "--destructive": "oklch(0.65 0.25 25)",
        "--destructive-foreground": "oklch(0.98 0.005 285)",
      },
    };

    let colors: ColorMap | null = null;

    if (config.preset === "custom" && config.customColors) {
      const c = config.customColors;
      // Para custom, calcular valores derivados
      const bgMatch = c.background.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
      const bgL = bgMatch ? parseFloat(bgMatch[1]) : 0.12;
      const bgC = bgMatch ? parseFloat(bgMatch[2]) : 0.005;
      const bgH = bgMatch ? parseFloat(bgMatch[3]) : 285;
      const isDark = bgL <= 0.5;
      const step = isDark ? 0.06 : -0.04;
      const borderStep = isDark ? 0.10 : -0.08;
      const fgMatch = c.foreground.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
      const fgL = fgMatch ? parseFloat(fgMatch[1]) : (isDark ? 0.98 : 0.15);
      const fgC2 = fgMatch ? parseFloat(fgMatch[2]) : 0.005;
      const fgH2 = fgMatch ? parseFloat(fgMatch[3]) : 285;
      const clamp = (v: number) => Math.max(0.02, Math.min(0.97, v));
      const secondary = `oklch(${clamp(bgL + step).toFixed(3)} ${bgC.toFixed(3)} ${bgH})`;
      const border = `oklch(${clamp(bgL + borderStep).toFixed(3)} ${bgC.toFixed(3)} ${bgH})`;
      const mutedFg = `oklch(${clamp(fgL - (isDark ? 0.35 : -0.35)).toFixed(3)} ${fgC2.toFixed(3)} ${fgH2})`;

      colors = {
        "--primary": c.primary,
        "--primary-foreground": c.primaryFg,
        "--background": c.background,
        "--foreground": c.foreground,
        "--card": c.card,
        "--sidebar": c.sidebar,
        "--accent": c.accent,
        "--ring": c.ring,
        "--secondary": secondary,
        "--secondary-foreground": c.foreground,
        "--muted": secondary,
        "--muted-foreground": mutedFg,
        "--border": border,
        "--input": border,
        "--card-foreground": c.foreground,
        "--popover": c.card,
        "--popover-foreground": c.foreground,
        "--sidebar-foreground": c.foreground,
        "--sidebar-primary": c.primary,
        "--sidebar-primary-foreground": c.primaryFg,
        "--sidebar-accent": secondary,
        "--sidebar-accent-foreground": c.foreground,
        "--sidebar-border": border,
        "--sidebar-ring": c.ring,
        "--accent-foreground": c.primaryFg,
        "--destructive": isDark ? "oklch(0.65 0.25 25)" : "oklch(0.55 0.22 25)",
        "--destructive-foreground": "oklch(0.98 0.005 285)",
      };
    } else if (config.preset && presets[config.preset]) {
      colors = presets[config.preset];
    }

    if (!colors) return;

    const root = document.documentElement;
    for (const [key, val] of Object.entries(colors)) {
      root.style.setProperty(key, val);
    }

    // Detectar se é tema claro
    const bgMatch = colors["--background"].match(/oklch\(([\d.]+)/);
    const isLight = bgMatch && parseFloat(bgMatch[1]) > 0.5;
    if (isLight) {
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
    }
  } catch (e) {
    // Silently ignore
  }
})();

// Register Service Worker for PWA
registerServiceWorker();

// Initialize offline database
initOfflineDB().catch(console.error);

// Restore scheduled workout reminders
restoreScheduledReminders();

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
