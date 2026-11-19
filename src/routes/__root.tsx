import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { ProjectViewHost } from "~/components/layout/ProjectViewHost";
import { DEFAULT_LANGUAGE, I18nProvider } from "~/i18n";
import { DEFAULT_THEME } from "~/styles/themes";
import { ThemeProvider } from "~/styles/themes/ThemeProvider";
import globalCss from "~/styles/global.css?url";
import logoUrl from "~/assets/avalon_logo.svg";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Avalon" },
    ],
    links: [
      { rel: "stylesheet", href: globalCss },
      { rel: "icon", type: "image/svg+xml", href: logoUrl },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang={DEFAULT_LANGUAGE} data-theme={DEFAULT_THEME}>
      <head>
        <HeadContent />
      </head>
      <body>
        <div id="app-root">{children}</div>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AppLayout>
          <Outlet />
          <ProjectViewHost />
        </AppLayout>
      </ThemeProvider>
    </I18nProvider>
  );
}
