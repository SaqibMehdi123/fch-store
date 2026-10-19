import type { Metadata } from "next";
import type { ProductCardData } from "@/lib/products";

/**
 * Central SEO toolkit — site identity, absolute-URL helpers, a <script
 * type="application/ld+json"> renderer and builders for the schema.org
 * entities used across the storefront (Organization, WebSite, Product,
 * ItemList, BreadcrumbList, FAQPage, ClothingStore).
 *
 * Every URL leaves this file absolute so JSON-LD and canonicals stay valid
 * no matter which environment (local / preview / production) renders them.
 */

export const SITE = {
  name: "Fashion and Collection House",
  shortName: "FCH",
  tagline: "Premium Pakistani Clothing, Nationwide",
  description:
    "FCH — premium Pakistani clothing delivered nationwide. Kurtas, lawn suits, formals and luxury pret with careful quality checks, honest pricing and customer care that answers within hours.",
  locale: "en-PK",
  currency: "PKR",
  city: "Karachi",
  country: "Pakistan",
} as const;

export function siteUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function absUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Absolute product image URLs — DB may store relative /placeholders paths. */
export function absImage(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//.test(url)) return url;
  return absUrl(url);
}

/** Renders one or more JSON-LD entities in a single script tag. */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // Entities are built from our own DB fields, never user HTML input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

// ---------------------------------------------------------------
// Metadata helper
// ---------------------------------------------------------------

/**
 * Standard page metadata with a non-duplicated brand suffix (the root layout
 * template `%s | Fashion and Collection House` would otherwise append the
 * brand twice to any title that already carries it), canonical URL and
 * OpenGraph/Twitter card fields.
 */
export function pageMetadata({
  title,
  description,
  path,
  keywords,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noindex?: boolean;
}): Metadata {
  const absTitle = title.includes(SITE.name) ? title : `${title} — ${SITE.name}`;
  return {
    title: { absolute: absTitle },
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: path },
    robots: noindex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
    openGraph: {
      title: absTitle,
      description,
      url: path,
      type: "website",
      siteName: SITE.name,
      locale: SITE.locale,
    },
    twitter: {
      card: "summary_large_image",
      title: absTitle,
      description,
    },
  };
}

// ---------------------------------------------------------------
// JSON-LD builders
// ---------------------------------------------------------------

export function organizationLd(social: { instagramUrl?: string; facebookUrl?: string }) {
  const sameAs = [social.instagramUrl, social.facebookUrl].filter(Boolean) as string[];
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    alternateName: SITE.shortName,
    url: siteUrl(),
    logo: absUrl("/logo.svg"),
    description: SITE.description,
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    alternateName: SITE.shortName,
    url: siteUrl(),
    inLanguage: "en-PK",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl()}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function clothingStoreLd(s: {
  phone: string;
  email: string;
  address: string;
  whatsappNumber: string;
  instagramUrl: string;
  facebookUrl: string;
}) {
  const sameAs = [s.instagramUrl, s.facebookUrl].filter(Boolean) as string[];
  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: SITE.name,
    alternateName: SITE.shortName,
    url: siteUrl(),
    logo: absUrl("/logo.svg"),
    image: absUrl("/logo-light.svg"),
    description: SITE.description,
    priceRange: "PKR",
    currenciesAccepted: "PKR",
    paymentAccepted: "Bank transfer, Raast",
    areaServed: { "@type": "Country", name: SITE.country },
    ...(s.phone ? { telephone: s.phone } : {}),
    ...(s.email ? { email: s.email } : {}),
    ...(s.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: s.address,
            addressLocality: SITE.city,
            addressCountry: "PK",
          },
        }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  };
}

export function itemListLd(products: ProductCardData[], listName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absUrl(`/product/${p.slug}`),
      name: p.name,
      image: absImage(p.image),
      ...(p.salePrice ?? p.price
        ? {
            item: {
              "@type": "Product",
              name: p.name,
              image: absImage(p.image),
              offers: {
                "@type": "Offer",
                price: p.salePrice ?? p.price,
                priceCurrency: SITE.currency,
                availability: p.inStock
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              },
            },
          }
        : {}),
    })),
  };
}

/**
 * FAQPage schema from the DB-driven markdown page: `## Question` headings
 * with the text that follows as the accepted answer.
 */
export function parseFaqMarkdown(content: string): { q: string; a: string }[] {
  const plain = (md: string) =>
    md
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → text
      .replace(/[*_`>#]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const out: { q: string; a: string }[] = [];
  const parts = content.split(/^\s*##\s+/m).slice(1);
  for (const part of parts) {
    const [q, ...rest] = part.split("\n");
    const a = plain(rest.join("\n"));
    if (q?.trim() && a) out.push({ q: plain(q), a });
  }
  return out;
}
