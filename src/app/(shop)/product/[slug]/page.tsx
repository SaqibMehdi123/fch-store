import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Truck, ShieldCheck, RefreshCcw, BadgeCheck } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { discountPercent, formatDate, formatPKR } from "@/lib/format";
import { ProductGallery } from "@/components/store/product-gallery";
import { VariantPicker } from "@/components/store/variant-picker";
import { WishlistHeart } from "@/components/store/wishlist-heart";
import { ReviewForm } from "@/components/store/review-form";
import { ProductCard } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section-heading";
import { cn } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found — FCH" };

  const price = product.salePrice ?? product.price;
  return {
    title: `${product.name} — Fashion and Collection House`,
    description: product.description.slice(0, 155),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 155),
      images: product.images.slice(0, 1),
      type: "website",
    },
    alternates: { canonical: `/product/${product.slug}` },
    other: { "product:price:amount": String(price), "product:price:currency": "PKR" },
  };
}

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("h-4 w-4", n <= Math.round(rating) ? "fill-gold text-gold" : "text-stone")} aria-hidden />
      ))}
    </span>
  );
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, settings] = await Promise.all([getRelatedProducts(product), getSettings()]);
  const off = discountPercent(product.price, product.salePrice);
  const price = product.salePrice ?? product.price;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "Fashion and Collection House" },
    offers: {
      "@type": "Offer",
      url: `/product/${product.slug}`,
      priceCurrency: "PKR",
      price,
      availability: product.totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.ratingCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.ratingAvg,
        reviewCount: product.ratingCount,
      },
    }),
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-gold">Home</Link>
        <span aria-hidden className="mx-2">/</span>
        <Link href="/shop" className="transition-colors hover:text-gold">Shop</Link>
        {(() => {
          // categoryPath is leaf → root; the root gets its own department page
          const path = product.categoryPath.slice().reverse();
          const rootSlug = path.length ? path[path.length - 1].slug : null;
          return path.map((c, i) => (
            <span key={c.slug}>
              <span aria-hidden className="mx-2">/</span>
              <Link
                href={rootSlug && i === path.length - 1 ? `/${c.slug}` : `/${rootSlug}?category=${c.slug}`}
                className="transition-colors hover:text-gold"
              >
                {c.name}
              </Link>
            </span>
          ));
        })()}
      </nav>

      {/* main */}
      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* gallery */}
        <div className="relative">
          <WishlistHeart slug={product.slug} label={product.name} size="lg" className="absolute right-4 top-4 z-10" />
          <ProductGallery images={product.images} name={product.name} />
        </div>

        {/* details */}
        <div className="flex flex-col">
          <p className="label-caps text-gold">{product.categoryPath[0]?.name}</p>
          <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{product.name}</h1>

          {product.ratingCount > 0 && (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <Stars rating={product.ratingAvg} />
              <span>
                {product.ratingAvg} · {product.ratingCount} {product.ratingCount === 1 ? "review" : "reviews"}
              </span>
            </a>
          )}

          {/* price */}
          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className={cn("font-display text-3xl", off !== null && "text-gold")}>{formatPKR(price)}</span>
            {product.salePrice !== null && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPKR(product.price)}</span>
                <span className="bg-gold px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                  Save {off}%
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Tax included · Free delivery above {formatPKR(settings.freeShippingThreshold)}
          </p>

          {/* variants */}
          <div className="mt-8">
            <VariantPicker
              productName={product.name}
              variants={product.variants}
              whatsappNumber={settings.whatsappNumber}
            />
          </div>

          {/* promises */}
          <ul className="mt-9 space-y-2.5 border-t border-stone pt-6 text-sm text-muted-foreground">
            <li className="flex items-center gap-2.5">
              <Truck className="h-4 w-4 text-gold" strokeWidth={1.6} />
              Nationwide delivery in 2–6 days, to every city in Pakistan
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-gold" strokeWidth={1.6} />
              Pay via bank transfer or Raast — verified before dispatch
            </li>
            <li className="flex items-center gap-2.5">
              <RefreshCcw className="h-4 w-4 text-gold" strokeWidth={1.6} />
              Easy exchange on unused items with tags intact
            </li>
          </ul>
        </div>
      </div>

      {/* description & fabric */}
      <section className="mt-16 grid gap-10 border-t border-stone pt-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl">Description</h2>
          <p className="mt-4 max-w-prose text-[15px] leading-7 text-foreground/80">{product.description}</p>
        </div>
        {product.fabricDetails && (
          <div>
            <h2 className="font-display text-2xl">Fabric & Care</h2>
            <div className="mt-4 rounded-sm border border-stone bg-card p-5">
              <p className="text-[15px] leading-7 text-foreground/80">{product.fabricDetails}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Care instructions are printed on the article; when in doubt, gentle cycle and shade-dry.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* reviews */}
      <section id="reviews" className="mt-16 scroll-mt-24 border-t border-stone pt-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
          <div>
            <h2 className="font-display text-2xl">
              Reviews {product.ratingCount > 0 && <span className="text-muted-foreground">({product.ratingCount})</span>}
            </h2>

            {product.ratingCount === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No reviews yet — be the first to share how it fits and feels.
              </p>
            ) : (
              <>
                <div className="mt-4 flex items-center gap-3">
                  <span className="font-display text-4xl">{product.ratingAvg}</span>
                  <div>
                    <Stars rating={product.ratingAvg} />
                    <p className="mt-0.5 text-xs text-muted-foreground">Based on {product.ratingCount} approved reviews</p>
                  </div>
                </div>

                <ul className="mt-8 space-y-7">
                  {product.reviews.map((r) => (
                    <li key={r.id} className="border-b border-stone/70 pb-7 last:border-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Stars rating={r.rating} className="[&_svg]:h-3.5 [&_svg]:w-3.5" />
                        {r.title && <p className="text-sm font-semibold">{r.title}</p>}
                      </div>
                      <p className="mt-2 text-[15px] leading-6 text-foreground/85">{r.body}</p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/70">{r.name}</span>
                        <span aria-hidden>·</span>
                        <span>{formatDate(r.date)}</span>
                        {r.verified && (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <BadgeCheck className="h-3.5 w-3.5" /> Verified purchase
                          </span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="rounded-sm border border-stone bg-card p-6">
            <h3 className="font-display text-xl">Write a review</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Share an honest take — other shoppers rely on these.
            </p>
            <div className="mt-5">
              <ReviewForm productId={product.id} />
            </div>
          </div>
        </div>
      </section>

      {/* related */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-stone pt-10">
          <SectionHeading eyebrow="You may also like" title="Pairs well with" align="center" />
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
