import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { getSettings } from "@/lib/settings";
import { JsonLd, organizationLd, websiteLd } from "@/lib/seo";

/**
 * Customer (storefront) layout shell:
 * announcement bar → header → content → dark footer
 * + floating WhatsApp button and sticky mobile bottom nav.
 *
 * Emits the site-wide Organization and WebSite (+ SearchAction) JSON-LD once,
 * for every storefront page; the admin panel is a separate segment and
 * deliberately excluded.
 */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd
        data={[
          organizationLd({
            instagramUrl: settings.instagramUrl,
            facebookUrl: settings.facebookUrl,
          }),
          websiteLd(),
        ]}
      />
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <SiteFooter />
      <WhatsAppButton />
      <MobileBottomNav />
    </div>
  );
}
