import Link from "next/link";
import { Truck, RefreshCcw, ShieldCheck, Instagram, Facebook, Music2, ChevronRight } from "lucide-react";
import { getHomeData } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { BannerCarousel } from "@/components/store/banner-carousel";
import { ProductCard } from "@/components/store/product-card";
import { ProductRail } from "@/components/store/product-rail";
import { SectionHeading } from "@/components/store/section-heading";

export const metadata = {
  title: "Fashion and Collection House — Premium Pakistani Clothing, Nationwide",
  description:
    "Kurtas, lawn suits, formals and luxury pret. Premium fabrics, careful finishing, honest pricing — delivered to every city in Pakistan.",
};

export default async function HomePage() {
  const [data, settings] = await Promise.all([getHomeData(), getSettings()]);
  const hasSocials = settings.instagramUrl || settings.facebookUrl || settings.tiktokUrl;

  return (
    <div className="animate-fade-in">
      {/* ── hero — banner carousel from the banners table ── */}
      <BannerCarousel slides={data.banners} />

      {/* ── trust strip ── */}
      <section className="border-b border-stone bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-7 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Nationwide Delivery", sub: "Every city & town in Pakistan" },
            { icon: ShieldCheck, title: "Verified Bank Transfer", sub: "Raast & IBAN, order-checked" },
            { icon: RefreshCcw, title: "Easy Exchange", sub: "Customer-friendly policy" },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-3.5">
              <Icon className="h-5.5 w-5.5 shrink-0 text-gold" strokeWidth={1.6} />
              <div>
                <p className="text-[13px] font-semibold tracking-wide">{title}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── shop by category ── */}
      <section className="mx-auto max-w-7xl px-6 py-14 sm:py-16">
        <SectionHeading
          eyebrow="Collections"
          title="Shop by Category"
          linkHref="/shop"
          linkLabel="View all"
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {data.categories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/${cat.slug}`}
              className="group relative block overflow-hidden rounded-sm bg-charcoal"
            >
              <div className="aspect-[4/5] sm:aspect-[3/4]">
                {cat.imageUrl ? (
                   
                  <img
                    src={cat.imageUrl}
                    alt={`${cat.name} collection`}
                    loading={i < 3 ? "eager" : "lazy"}
                    className="h-full w-full object-cover opacity-90 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-2xl text-ivory">
                    {cat.name}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                <div>
                  <h3 className="font-display text-2xl text-ivory">{cat.name}</h3>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-ivory/70">
                    {cat.children.length} ranges
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-ivory transition-all duration-300 group-hover:border-gold group-hover:bg-gold">
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── new arrivals ── */}
      <section className="mx-auto max-w-7xl px-6 pb-14 sm:pb-16">
        <SectionHeading
          eyebrow="Just landed"
          title="New Arrivals"
          linkHref="/shop?sort=newest"
          linkLabel="Shop new"
        />
        <div className="mt-8">
          <ProductRail>
            {data.newArrivals.map((p) => (
              <ProductCard
                key={p.slug}
                product={p}
                className="w-[72%] min-w-[72%] snap-start sm:w-[46%] sm:min-w-[46%] lg:w-[calc(25%-18px)] lg:min-w-[calc(25%-18px)]"
              />
            ))}
          </ProductRail>
        </div>
      </section>

      {/* ── sale strip ── */}
      {data.onSale.length > 0 && (
        <section className="border-y border-stone bg-secondary/50">
          <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16">
            <SectionHeading
              eyebrow="For a limited time"
              title="Mid-Season Sale"
              linkHref="/shop?on_sale=1"
              linkLabel="All offers"
            />
            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
              {data.onSale.slice(0, 4).map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── featured edit ── */}
      <section className="mx-auto max-w-7xl px-6 py-14 sm:py-16">
        <SectionHeading
          eyebrow="Chosen by our atelier"
          title="The Featured Edit"
          linkHref="/shop?sort=bestselling"
          linkLabel="Shop featured"
        />
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
          {data.featured.slice(0, 8).map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* ── brand statement ── */}
      <section className="bg-charcoal">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
          <p className="label-caps text-gold-soft">Fashion and Collection House</p>
          <p className="mt-4 font-display text-2xl leading-relaxed text-ivory sm:text-3xl">
            “Fabrics that feel exceptional, fits that flatter, and detail work
            that rewards a closer look.”
          </p>
          <Link href="/about" className="btn-outline-luxury mt-8 !border-ivory/60 !text-ivory hover:!bg-ivory hover:!text-charcoal">
            Our Story
          </Link>
        </div>
      </section>

      {/* ── socials ── */}
      {hasSocials && (
        <section className="mx-auto max-w-7xl px-6 py-14 text-center">
          <p className="label-caps text-gold">Follow the house</p>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl">@fch.pk</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            New drops, styling notes and behind-the-scenes from the studio.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            {settings.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                 className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone transition-all hover:border-gold hover:text-gold">
                <Instagram className="h-5 w-5" strokeWidth={1.6} />
              </a>
            )}
            {settings.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                 className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone transition-all hover:border-gold hover:text-gold">
                <Facebook className="h-5 w-5" strokeWidth={1.6} />
              </a>
            )}
            {settings.tiktokUrl && (
              <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                 className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone transition-all hover:border-gold hover:text-gold">
                <Music2 className="h-5 w-5" strokeWidth={1.6} />
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
