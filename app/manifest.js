// Web app manifest: makes Trusted Antigua installable on phones
// (Add to Home Screen on Android/iOS). The installed app keeps its
// session storage, so people stay signed in inside the app.
export default function manifest() {
  return {
    name: "Trusted Antigua",
    short_name: "Trusted Antigua",
    description:
      "Find honest, reliable tradespeople and service providers in Antigua & Barbuda, recommended by real residents.",
    start_url: "/",
    display: "standalone",
    background_color: "#0C1526",
    theme_color: "#0C1526",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
  };
}
