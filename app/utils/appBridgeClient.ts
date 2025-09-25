// Minimal App Bridge v4 client (no Provider)
import createApp from "@shopify/app-bridge";

let _app: ReturnType<typeof createApp> | null = null;

export function getAppBridge() {
  if (typeof window === "undefined") return null; // SSR guard
  if (_app) return _app;

  const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY as string | undefined;
  const host = new URLSearchParams(window.location.search).get("host") ?? undefined;

  if (!apiKey || !host) return null; // Not loaded from Admin yet
  _app = createApp({ apiKey, host, forceRedirect: true });
  return _app;
}
