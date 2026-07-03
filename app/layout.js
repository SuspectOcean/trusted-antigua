import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "Trusted Antigua — Find trusted tradespeople",
  description:
    "Find honest, reliable tradespeople and home-service providers in Antigua & Barbuda — recommended by real residents.",
};

export const viewport = {
  themeColor: "#0C1526",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-bg text-ink">
        <header className="sticky top-0 z-30 bg-navy border-b border-white/10">
          <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-wide text-ink">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber text-navy text-sm font-extrabold">TA</span>
              <span>Trusted Antigua</span>
            </Link>
            <Link href="/recommend" className="text-xs bg-amber hover:bg-amber-600 text-navy font-semibold px-3 py-1.5 rounded-full">
              + Recommend
            </Link>
          </div>
        </header>
        <main className="max-w-xl mx-auto px-4 pt-4 safe-bottom">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
