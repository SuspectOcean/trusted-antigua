// Single source of truth for site identity + public contact.
// Email structure: info@ (general contact, shown on the site) and
// admin@ (platform administration, moderation, review disputes — internal).
// Deliberately no legal@ — this is a consumer review platform, not a legal service.
export const SITE_NAME = "Trusted Antigua";
// Single place to change when the custom domain goes live (drives canonical URLs, OG tags, sitemap, robots).
export const SITE_URL = "https://trustedantigua.com";
export const OPERATOR = "the Trusted Antigua team";
// Public contact. Kept truthful: only set once the mailbox actually receives mail,
// because publishing a dead address is worse than publishing none.
export const LEGAL_EMAIL = "info@trustedantigua.com";
export const CONTACT_FALLBACK = "Contact details will be published before the public launch.";
export const LEGAL_EFFECTIVE_DATE = "14 July 2026";
