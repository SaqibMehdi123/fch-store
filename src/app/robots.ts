import type { MetadataRoute } from "next";

/**
 * robots.txt derived from NEXTAUTH_URL so production, preview and local
 * environments each reference their own origin's sitemap.
 *
 * Crawler-private surfaces (admin, api, cart/checkout flows) are disallowed.
 * AI search crawlers are explicitly ALLOWED — FCH wants to be cited by
 * ChatGPT, Perplexity, Claude, Gemini and friends — so the AI group repeats
 * the same disallow list (a bot matching an explicit group ignores the `*`
 * group entirely, so the private-path protection must be restated there).
 */
const BASE = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

const PRIVATE_PATHS = [
  "/admin",
  "/admin/",
  "/api/",
  "/cart",
  "/checkout",
  "/wishlist",
  "/order/",
  "/track-order?",
];

// AI assistants & AI search engines that should index the storefront.
const AI_CRAWLERS = [
  "GPTBot", // OpenAI (ChatGPT)
  "OAI-SearchBot", // ChatGPT Search
  "ChatGPT-User", // user-initiated ChatGPT fetches
  "PerplexityBot", // Perplexity AI search
  "Perplexity-User",
  "ClaudeBot", // Anthropic (Claude)
  "Claude-User",
  "Claude-SearchBot",
  "Google-Extended", // Gemini grounding
  "Applebot-Extended", // Apple Intelligence
  "Meta-ExternalAgent", // Meta AI
  "Amazonbot", // Alexa
  "DuckAssistBot", // DuckDuckGo AI
  "YouBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      {
        // Explicitly welcome AI search; same private-path guard as above.
        userAgent: AI_CRAWLERS,
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
