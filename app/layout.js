import "./globals.css";
import Link from "next/link";
import { Fraunces, Work_Sans } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/components/AuthProvider";

// Work Sans carries the interface — body copy, buttons, data, labels.
const workSans = Work_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-sans" });
// Fraunces carries names — headings and every person/business name in the registry.
// Reserved for that one job so it stays a signature, not a default.
const fraunces = Fraunces({ subsets: ["latin"], weight: ["500", "600", "700", "900"], style: ["normal", "italic"], display: "swap", variable: "--font-display" });

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
    <html lang="en" className={`${workSans.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-bg text-ink font-sans">
        <AuthProvider>
          <header className="sticky top-0 z-30 bg-navy border-b border-white/10">
            <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-ink">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-amber/60 text-amber text-[11px] font-display font-semibold" style={{ transform: "rotate(-6deg)" }}>TA</span>
                <span className="font-display font-semibold tracking-wide">Trusted Antigua</span>
              </Link>
              <Link href="/recommend" className="text-xs bg-amber hover:bg-amber-600 text-navy font-semibold px-3 py-1.5 rounded-full">
                + Recommend
              </Link>
            </div>
          </header>
          <main className="max-w-xl mx-auto px-4 pt-4 safe-bottom">{children}</main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
