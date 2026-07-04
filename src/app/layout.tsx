import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { ToastContainer } from "@/components/toast";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: "INTAEROBASE — Aviation CMS",
  description: "Aviation Federal Contract Management",
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 5, themeColor: "#5d87ff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Sidebar />
        <div className="page-content min-h-screen flex flex-col transition-[padding] duration-300">
          <Topbar />
          <div className="flex-1 bg-[var(--content-bg)] rounded-bb">
            <div className="container py-6 lg:py-8 px-4 lg:px-6">{children}</div>
          </div>
        </div>
        <ToastContainer />
      </body>
    </html>
  );
}
