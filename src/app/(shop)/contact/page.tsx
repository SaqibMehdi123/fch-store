import type { Metadata } from "next";
import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "@/components/store/contact-form";
import { JsonLd, clothingStoreLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "Contact Us — Fashion and Collection House" },
  description:
    "Questions about an order, sizing or exchange? Reach the FCH team by phone, WhatsApp or email — we usually reply within hours.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Us — Fashion and Collection House",
    description:
      "Questions about an order, sizing or exchange? Reach the FCH team by phone, WhatsApp or email — we usually reply within hours.",
    url: "/contact",
    type: "website",
    siteName: "Fashion and Collection House",
    locale: "en-PK",
  },
};

export default async function ContactPage() {
  const settings = await getSettings();
  const waDigits = settings.whatsappNumber.replace(/\D/g, "");

  const channels = [
    settings.phone && { icon: Phone, label: "Phone", value: settings.phone },
    settings.whatsappNumber && {
      icon: MessageCircle,
      label: "WhatsApp",
      value: settings.whatsappNumber,
      href: waDigits.length >= 10 ? `https://wa.me/${waDigits}` : undefined,
    },
    settings.email && { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    settings.address && { icon: MapPin, label: "Studio", value: settings.address },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string }[];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:py-14">
      <JsonLd data={clothingStoreLd(settings)} />

      <header className="border-b border-stone pb-6">
        <p className="label-caps text-gold">We're here to help</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">Contact Us</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Order help, sizing advice, exchanges or anything else — every message reaches a real person on our team.
        </p>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[380px_1fr]">
        {/* channels */}
        <aside>
          <ul className="space-y-5">
            {channels.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex items-start gap-3.5">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone text-gold">
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.6} />
                </span>
                <div>
                  <p className="label-caps text-muted-foreground">{label}</p>
                  {href ? (
                    <a
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="text-[15px] transition-colors hover:text-gold"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="text-[15px]">{value}</p>
                  )}
                </div>
              </li>
            ))}
            <li className="flex items-start gap-3.5">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone text-gold">
                <Clock className="h-4.5 w-4.5" strokeWidth={1.6} />
              </span>
              <div>
                <p className="label-caps text-muted-foreground">Hours</p>
                <p className="text-[15px]">Mon–Sat, 10am – 8pm (PKT)</p>
              </div>
            </li>
          </ul>

          {waDigits.length >= 10 && (
            <a
              href={`https://wa.me/${waDigits}?text=${encodeURIComponent("Hello FCH! I have a question.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-luxury mt-8 w-full"
            >
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          )}
        </aside>

        {/* form */}
        <div className="rounded-sm border border-stone bg-card p-6 sm:p-8">
          <h2 className="font-display text-2xl">Send us a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We reply to {settings.email || "our inbox"} within a few working hours.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
