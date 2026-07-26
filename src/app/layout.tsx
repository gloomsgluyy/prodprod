import type { Metadata } from "next";
import "./globals.css";
import { NextAuthProvider } from "@/providers/session-provider";
import { QueryProvider } from "@/providers/query-provider";
import { NotificationProvider } from "@/providers/notification-provider";

export const metadata: Metadata = {
  title: "CoalTrade OS",
  description: "Internal operating system for coal trading operations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("stisla-theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t;})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <NextAuthProvider>
          <QueryProvider>
            {children}
            <NotificationProvider />
          </QueryProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
