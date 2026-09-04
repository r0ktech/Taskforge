import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/providers/SessionProvider";
import { SocketProvider } from "@/providers/SocketProvider";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "Task Forge — Project management, built for momentum",
  description:
    "Organizations, workspaces, teams, projects, and real-time Kanban boards — Task Forge is where distributed teams plan and ship together.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Let people pinch-zoom; capping at 1 would be an accessibility regression.
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F8FB" },
    { media: "(prefers-color-scheme: dark)", color: "#131419" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lexend:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('tf-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <SessionProvider>
          <SocketProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </SocketProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
