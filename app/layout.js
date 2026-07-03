import "./globals.css";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export const metadata = {
  title: "Trusted Antigua — Find trusted tradespeople",
  description:
    "Find honest, reliable tradespeople and home-service providers in Antigua & Barbuda — recommended by real residents.",
};

export const viewport = {
  themeColor: "#12808A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="sticky top-0 z-30 bg-navy text-white">
          <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-wide">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal text-white text-sm">TA</span>
              <span>Trusted Antigua</span>
            </Link>
            <Link href="/recommend" className="text-xs bg-gold/90 hover:bg-gold text-white font-semibold px-3 py-1.5 rounded-full">
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
