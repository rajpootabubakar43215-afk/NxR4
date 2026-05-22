import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Nxr4 Server Dashboard - CoD 1.1 Real-time Monitor",
  description: "Real-time monitoring dashboard for Nxr4 Call of Duty 1.1 servers. Live player counts, server status, and game information.",
  keywords: ["Nxr4", "Call of Duty", "CoD 1.1", "Game Server", "Dashboard", "Server Monitor"],
  authors: [{ name: "Nxr4 Gaming" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
        title: "Nxr4 Server Dashboard",
    description: "Real-time monitoring for Nxr4 CoD 1.1 servers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
        title: "Nxr4 Server Dashboard",
    description: "Real-time monitoring for Nxr4 CoD 1.1 servers",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
