// app/root.tsx
import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

export const meta: MetaFunction = () => [
  { title: "Discounts Galore" },
];

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: polarisStyles },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <PolarisAppProvider i18n={enTranslations}>
          <Outlet />
        </PolarisAppProvider>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
