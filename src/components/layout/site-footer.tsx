import Link from "next/link";
import { Instagram, Facebook, Music2, Phone, Mail, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { getSettings } from "@/lib/settings";

const SHOP_LINKS = [
  { href: "/women", label: "Women" },
  { href: "/men", label: "Men" },
  { href: "/kids", label: "Kids" },
  { href: "/shop", label: "Shop All" },
  { href: "/shop?on_sale=1", label: "Sale" },
];

const SERVICE_LINKS = [
  { href: "/track-order", label: "Track Order" },
  { href: "/contact", label: "Contact Us" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About Us" },
];

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
];

/**
 * Dark charcoal footer — brand, page links, socials, contact.
 */
export async function SiteFooter() {
  const settings = await getSettings();
  const hasSocials = settings.instagramUrl || settings.facebookUrl || settings.tiktokUrl;

  return (
    <footer className="mt-auto bg-footer text-footer-foreground">
      <div className="mx-auto max-w-7xl px-6 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* brand */}
        <div>
          <BrandLogo light />
          <p className="mt-4 text-sm leading-6 text-footer-foreground/80 max-w-xs">
            Premium Pakistani clothing, delivered nationwide. Thoughtfully made, carefully packed, honestly priced.
          </p>
          {hasSocials && (
            <div className="mt-5 flex items-center gap-4">
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-footer-foreground/70 hover:text-gold transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-footer-foreground/70 hover:text-gold transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings.tiktokUrl && (
                <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-footer-foreground/70 hover:text-gold transition-colors">
                  <Music2 className="h-5 w-5" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* shop */}
        <nav aria-label="Shop links">
          <h3 className="label-caps text-gold-soft">Shop</h3>
          <ul className="mt-4 space-y-2.5">
            {SHOP_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm text-footer-foreground/80 hover:text-ivory transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* customer service */}
        <nav aria-label="Customer service links">
          <h3 className="label-caps text-gold-soft">Customer Care</h3>
          <ul className="mt-4 space-y-2.5">
            {SERVICE_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm text-footer-foreground/80 hover:text-ivory transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-2.5">
            {LEGAL_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm text-footer-foreground/60 hover:text-ivory transition-colors text-xs">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* contact */}
        <div>
          <h3 className="label-caps text-gold-soft">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-footer-foreground/80">
            {settings.phone && (
              <li className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 mt-0.5 text-gold-soft/70" />
                <span>{settings.phone}</span>
              </li>
            )}
            {settings.email && (
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 mt-0.5 text-gold-soft/70" />
                <a href={`mailto:${settings.email}`} className="hover:text-ivory transition-colors">
                  {settings.email}
                </a>
              </li>
            )}
            {settings.address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 text-gold-soft/70" />
                <span>{settings.address}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-footer-foreground/60">
            © {new Date().getFullYear()} Fashion and Collection House. All rights reserved.
          </p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-footer-foreground/50">
            Secure Bank Transfer · Raast · Nationwide Delivery
          </p>
        </div>
      </div>
    </footer>
  );
}
