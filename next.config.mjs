/** @type {import('next').NextConfig} */

// Security headers applied to every response.
//
// Why these, and why not more:
//  - X-Content-Type-Options: nosniff  — THE important one. Storage objects are
//    served with the content type they were stored as. Without nosniff a browser
//    may sniff a file's bytes and decide an "image/jpeg" is really HTML, which is
//    how a disguised upload turns into stored XSS. With nosniff the declared type
//    is final, so a non-image uploaded to the photo bucket is inert.
//  - X-Frame-Options: DENY — the site carries an authenticated session and a
//    sign-in sheet; framing it enables clickjacking. Nothing embeds us.
//  - Referrer-Policy — don't leak full URLs (which include provider ids) to
//    third-party sites when a user taps an advert or an external contact link.
//  - Permissions-Policy — switch off capabilities we don't use. camera and
//    geolocation are deliberately LEFT ENABLED: camera is needed for taking
//    review/portfolio photos, geolocation for any future "near me" search.
//
// Deliberately NOT set here:
//  - Content-Security-Policy. Next.js emits inline scripts, so a strict CSP needs
//    a nonce/hash setup and real testing; a careless one silently breaks the app.
//    Worth doing, but as its own piece of work with report-only first.
//  - Strict-Transport-Security. Already served by Vercel (max-age 63072000).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "microphone=(), payment=(), usb=()" },
];

const nextConfig = {
  // Don't advertise the framework version.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
