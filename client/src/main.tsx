import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
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

  window.location.href = getLoginUrl();
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
(function initTheme() {
  try {
    const saved = localStorage.getItem("gym-theme-config");
    if (!saved) return;
    const config = JSON.parse(saved);
    const presets: Record<string, Record<string, string>> = {
      "dark-red": {
        "--primary": "oklch(0.55 0.22 25)",
        "--primary-foreground": "oklch(0.98 0.005 285)",
        "--background": "oklch(0.12 0.005 285)",
        "--foreground": "oklch(0.98 0.005 285)",
        "--card": "oklch(0.15 0.005 285)",
        "--sidebar": "oklch(0.12 0.005 285)",
        "--accent": "oklch(0.55 0.22 25)",
        "--ring": "oklch(0.55 0.22 25)",
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
      },
    };

    let colors: Record<string, string> | null = null;
    if (config.preset === "custom" && config.customColors) {
      const c = config.customColors;
      colors = {
        "--primary": c.primary,
        "--primary-foreground": c.primaryFg,
        "--background": c.background,
        "--foreground": c.foreground,
        "--card": c.card,
        "--sidebar": c.sidebar,
        "--accent": c.accent,
        "--ring": c.ring,
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

    // Derivar cores secundárias
    const bg = colors["--background"];
    const fg = colors["--foreground"];
    const isDark = !isLight;
    root.style.setProperty("--card-foreground", fg);
    root.style.setProperty("--popover", colors["--card"]);
    root.style.setProperty("--popover-foreground", fg);
    root.style.setProperty("--sidebar-foreground", fg);
    root.style.setProperty("--sidebar-primary", colors["--primary"]);
    root.style.setProperty("--sidebar-primary-foreground", colors["--primary-foreground"]);
    root.style.setProperty("--sidebar-ring", colors["--ring"]);
    root.style.setProperty("--accent-foreground", colors["--primary-foreground"]);
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
