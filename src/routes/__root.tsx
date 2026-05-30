import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter, useRouterState, useNavigate,
  HeadContent, Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { ensureSeed } from "@/lib/db";
import { useAuth } from "@/hooks/use-auth";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="btn-primary mt-6">Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Lovable App" },
      { name: "description", content: "Generates a minimal, single-file React application for a blank white page." },
      { name: "theme-color", content: "#0A0A0A" },
      { property: "og:title", content: "Lovable App" },
      { name: "twitter:title", content: "Lovable App" },
      { property: "og:description", content: "Generates a minimal, single-file React application for a blank white page." },
      { name: "twitter:description", content: "Generates a minimal, single-file React application for a blank white page." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/11cc8e72-682b-4388-a2ff-7b2b090630b9/id-preview-4f298756--a8b87d36-6939-4b8f-b49f-b3af7e48e4a6.lovable.app-1780046246097.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/11cc8e72-682b-4388-a2ff-7b2b090630b9/id-preview-4f298756--a8b87d36-6939-4b8f-b49f-b3af7e48e4a6.lovable.app-1780046246097.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  // Inline pre-hydration theme script (avoids FOUC on theme switch)
  const themeInit = `(function(){try{var t=localStorage.getItem('biztrack:theme')||'neon';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','neon');}})();`;
  return (
    <html lang="en" dir="ltr" className="dark" data-theme="neon">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { user, loading } = useAuth();
  const routerState = useRouterState();
  const navigate = useNavigate();
  const path = routerState.location.pathname;
  const isAuthRoute = path === "/login" || path === "/signup";

  useEffect(() => { if (user) ensureSeed(); }, [user]);
  useEffect(() => {
    if (loading) return;
    if (!user && !isAuthRoute) navigate({ to: "/login", replace: true });
  }, [user, loading, isAuthRoute, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
