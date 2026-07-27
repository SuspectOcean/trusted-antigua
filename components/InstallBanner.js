"use client";
import { useEffect, useState } from "react";

// Top-of-page prompt to add Trusted Antigua to the home screen, mobile only.
// Android/Chrome: captures the native install event and offers a one-tap Install.
// iOS/Safari: Apple blocks programmatic install, so we show the manual steps.
// Dismissible (remembered for 14 days) and hidden once the app is installed.

const DISMISS_KEY = "ta_install_dismissed_at";
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallBanner() {
  const [deferred, setDeferred] = useState(null); // Android beforeinstallprompt event
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    // Register the service worker so the app is installable (enables the prompt).
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (isStandalone()) return; // already installed — nothing to prompt
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (at && Date.now() - at < DISMISS_MS) return; // recently dismissed
    } catch { /* storage blocked — carry on */ }

    const onBIP = (e) => { e.preventDefault(); setDeferred(e); setShow(true); };
    const onInstalled = () => setShow(false);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari never fires beforeinstallprompt — show the manual steps instead.
    if (isIOS()) { setIos(true); setShow(true); }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    setShow(false);
  }
  async function install() {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch { /* dismissed */ }
    setDeferred(null);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="lg:hidden bg-amber text-navy">
      <div className="max-w-xl mx-auto px-4 py-2 flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-navy/10 shrink-0" aria-hidden="true">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 3v12M8 11l4 4 4-4" /><path d="M4 21h16" />
          </svg>
        </span>
        <div className="min-w-0 flex-1 text-[13px] leading-tight font-medium">
          {ios ? (
            <>Add to your home screen: tap <b>Share</b>, then <b>Add to Home Screen</b>.</>
          ) : (
            <>Add Trusted Antigua to your home screen for one-tap access.</>
          )}
        </div>
        {!ios && deferred ? (
          <button onClick={install} className="shrink-0 bg-navy text-ink text-[13px] font-semibold px-3 py-1.5 rounded-full">Install</button>
        ) : null}
        <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-navy/70 hover:text-navy text-lg leading-none px-1">×</button>
      </div>
    </div>
  );
}
