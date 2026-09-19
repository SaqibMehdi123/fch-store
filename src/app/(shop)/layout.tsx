import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";

/**
 * Customer (storefront) layout shell:
 * announcement bar → header → content → dark footer
 * + floating WhatsApp button and sticky mobile bottom nav.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <SiteFooter />
      <WhatsAppButton />
      <MobileBottomNav />
    </div>
  );
}
