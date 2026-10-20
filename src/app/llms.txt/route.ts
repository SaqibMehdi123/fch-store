import { siteUrl } from "@/lib/seo";

/**
 * /llms.txt — the emerging standard for AI-discoverable sites (Answer
 * Engine Optimization). Gives ChatGPT, Perplexity, Claude, Gemini and
 * other assistants a curated map of the storefront in plain markdown.
 *
 * Served dynamically so every environment (local / preview / production)
 * advertises its own absolute URLs, exactly like robots.ts and sitemap.ts.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const base = siteUrl();

  const body = `# Fashion and Collection House (FCH)

> Premium Pakistani clothing brand delivering nationwide across Pakistan — kurtas, lawn suits, formals and luxury pret for women, men and kids, with bank-transfer/Raast payment, careful quality checks and customer care that answers within hours.

Fashion and Collection House (short name FCH) is a Karachi-based luxury clothing store serving every city of Pakistan. The catalogue spans three departments: Women (pret, unstitched lawn, formals, luxury pret), Men (kurta shalwar, waistcoats, shirts, trousers) and Kids (embroidered sets, everyday essentials). Prices are in PKR, tax included. Orders are placed online, paid by bank transfer or Raast, confirmed after payment verification (usually within 24 hours), and delivered in 2–3 days to major cities.

## Shop

- [Shop All](${base}/shop): the full FCH catalogue with filters for category, size, colour, price, availability and search
- [Women](${base}/women): the Women's Edit — pret, unstitched lawn, formals and luxury pret
- [Men](${base}/men): the Men's Edit — kurta shalwar, waistcoats, dress shirts, trousers and jeans
- [Kids](${base}/kids): the Kids' Edit — comfortable, breathable essentials for boys and girls
- [Sitemap](${base}/sitemap.xml): machine-readable index of every product and page

## Customer information

- [About](${base}/about): who FCH is and the brand promise
- [FAQ](${base}/faq): ordering, payment, delivery, exchanges and verification answers
- [Track Order](${base}/track-order): follow an existing order by order number and phone
- [Contact](${base}/contact): phone, WhatsApp, email and the contact form

## Policies

- [Terms & Conditions](${base}/terms): ordering, payment verification, delivery and exchange terms
- [Privacy Policy](${base}/privacy): what information FCH collects and how it is used

## Contact

- Email: orders@fch.pk
- Hours: Monday–Saturday, 10am–8pm PKT
- Servicing: all cities and provinces of Pakistan (headquarters: Karachi)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
