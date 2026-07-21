import "./globals.css";
import Link from "next/link";
import { Fraunces, Work_Sans } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/components/AuthProvider";
import AccountMenu from "@/components/AccountMenu";
import AdSlot from "@/components/AdSlot";
import { SITE_URL } from "@/lib/site";

const DESCRIPTION =
  "Find honest, reliable tradespeople and home-service providers in Antigua & Barbuda, recommended by real residents.";

// Work Sans carries the interface — body copy, buttons, data, labels.
const workSans = Work_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-sans" });
// Fraunces carries names — headings and every person/business name in the registry.
// Reserved for that one job so it stays a signature, not a default.
const fraunces = Fraunces({ subsets: ["latin"], weight: ["500", "600", "700", "900"], style: ["normal", "italic"], display: "swap", variable: "--font-display" });

export const metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Trusted Antigua",
  title: "Trusted Antigua: Find trusted tradespeople",
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Trusted Antigua",
    title: "Trusted Antigua: Find trusted tradespeople",
    description: DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trusted Antigua: Find trusted tradespeople",
    description: DESCRIPTION,
  },
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
              <div className="flex items-center gap-2">
                <Link href="/recommend" className="text-xs bg-amber hover:bg-amber-600 text-navy font-semibold px-3 py-1.5 rounded-full">
                  + Review
                </Link>
                <AccountMenu />
              </div>
            </div>
          </header>
          {/* Rails flex to fill the empty margin either side of the centre column,
              capped so they stay a sane advertising unit on very wide screens. */}
          <div className="lg:flex lg:justify-center lg:gap-5 lg:px-5">
            {/* Desktop left rail: advert or house content. Hidden on mobile. */}
            <aside className="hidden lg:block flex-1 max-w-[340px] min-w-0 pt-6" aria-label="Advertising">
              {/* Fills the visible screen height, minus header and a little breathing room. */}
              <div className="sticky top-[72px] h-[calc(100vh-88px)]"><AdSlot slotKey="desktop-rail-left" /></div>
            </aside>

            <main className="w-full max-w-xl mx-auto px-4 pt-4 safe-bottom">
              {children}
              {/* Mobile advertising now lives where intent is highest: in the Find
                  results feed and on provider pages. The old bottom-of-page slot
                  was below the fold on every screen, so it has been retired. */}
              <footer className="mt-8 mb-20 pt-4 border-t border-white/10 text-center text-[11px] text-muted">
                <Link href="/about" className="hover:text-slate2">About</Link>
                <span className="mx-2">·</span>
                <Link href="/privacy" className="hover:text-slate2">Privacy</Link>
                <span className="mx-2">·</span>
                <Link href="/terms" className="hover:text-slate2">Terms</Link>
                <span className="mx-2">·</span>
                <Link href="/guidelines" className="hover:text-slate2">Review Guidelines</Link>
              </footer>
            </main>

            {/* Desktop right rail. Hidden on mobile. */}
            <aside className="hidden lg:block flex-1 max-w-[340px] min-w-0 pt-6" aria-label="Advertising">
              <div className="sticky top-[72px] h-[calc(100vh-88px)]"><AdSlot slotKey="desktop-rail-right" /></div>
            </aside>
          </div>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
