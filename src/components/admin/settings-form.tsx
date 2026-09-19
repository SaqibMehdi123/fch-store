"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { saveSettings, type SettingsInput } from "@/app/actions/admin-content";

type SettingsFormState = {
  bank_name: string;
  account_title: string;
  iban: string;
  whatsapp_number: string;
  phone: string;
  email: string;
  address: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  announcement_text: string;
  announcement_enabled: boolean;
  free_shipping_threshold: string;
  payment_upload_deadline_hours: string;
  payment_approval_deadline_hours: string;
};

const field = "w-full rounded-sm border border-stone bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold";
const label = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-stone bg-card p-5">
      <h2 className="font-display text-xl">{title}</h2>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

export function SettingsForm({ initial }: { initial: SettingsFormState }) {
  const router = useRouter();
  const [form, setForm] = useState<SettingsFormState>(initial);
  const [pending, startTransition] = useTransition();

  const set = (key: keyof SettingsFormState, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    const payload: SettingsInput = {
      bank_name: form.bank_name,
      account_title: form.account_title,
      iban: form.iban,
      whatsapp_number: form.whatsapp_number,
      phone: form.phone,
      email: form.email,
      address: form.address,
      instagram_url: form.instagram_url,
      facebook_url: form.facebook_url,
      tiktok_url: form.tiktok_url,
      announcement_text: form.announcement_text,
      announcement_enabled: form.announcement_enabled,
      free_shipping_threshold: Number(form.free_shipping_threshold) || 0,
      payment_upload_deadline_hours: Number(form.payment_upload_deadline_hours) || 24,
      payment_approval_deadline_hours: Number(form.payment_approval_deadline_hours) || 48,
    };
    startTransition(async () => {
      const res = await saveSettings(payload);
      if (res.ok) {
        toast.success(res.message ?? "Settings saved.");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-gold">Configuration</p>
          <h1 className="mt-1 font-display text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything here is live on the storefront the moment you save.
          </p>
        </div>
        <button
          onClick={submit}
          disabled={pending}
          className="rounded-sm bg-primary px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Section title="Payment details" hint="Shown on the payment instructions screen after checkout.">
          <div>
            <label className={label} htmlFor="s-bank">Bank name</label>
            <input id="s-bank" value={form.bank_name} onChange={(e) => set("bank_name", e.target.value)} className={field} placeholder="Meezan Bank" />
          </div>
          <div>
            <label className={label} htmlFor="s-title">Account title</label>
            <input id="s-title" value={form.account_title} onChange={(e) => set("account_title", e.target.value)} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="s-iban">IBAN</label>
            <input
              id="s-iban"
              value={form.iban}
              onChange={(e) => set("iban", e.target.value.toUpperCase().replace(/\s+/g, ""))}
              className={`${field} font-mono`}
              placeholder="PK00XXXX0000000000000000"
            />
          </div>
        </Section>

        <Section title="Announcement bar" hint="The thin banner above the site header.">
          <div className="flex items-center justify-between rounded-sm border border-stone px-3 py-2.5">
            <span className="text-sm">Enabled</span>
            <Switch checked={form.announcement_enabled} onCheckedChange={(v) => set("announcement_enabled", v)} aria-label="Announcement enabled" />
          </div>
          <div>
            <label className={label} htmlFor="s-announce">Text</label>
            <input
              id="s-announce"
              value={form.announcement_text}
              onChange={(e) => set("announcement_text", e.target.value)}
              className={field}
              placeholder="Free delivery on orders above Rs. 10,000"
              maxLength={140}
            />
          </div>
          <div>
            <label className={label} htmlFor="s-freeship">Free-shipping threshold (Rs.)</label>
            <input
              id="s-freeship"
              type="number"
              min={0}
              value={form.free_shipping_threshold}
              onChange={(e) => set("free_shipping_threshold", e.target.value)}
              className={field}
            />
          </div>
        </Section>

        <Section title="Contact" hint="Used in the footer, contact page and WhatsApp button.">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="s-phone">Phone</label>
              <input id="s-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={field} placeholder="+92 300 0000000" />
            </div>
            <div>
              <label className={label} htmlFor="s-whatsapp">WhatsApp number</label>
              <input id="s-whatsapp" value={form.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} className={field} placeholder="923000000000" />
            </div>
          </div>
          <div>
            <label className={label} htmlFor="s-email">Email</label>
            <input id="s-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="s-address">Address</label>
            <input id="s-address" value={form.address} onChange={(e) => set("address", e.target.value)} className={field} placeholder="Shop 12, Zamzama Blvd, Karachi" />
          </div>
        </Section>

        <Section title="Social profiles" hint="Empty profiles are hidden from the footer.">
          <div>
            <label className={label} htmlFor="s-ig">Instagram URL</label>
            <input id="s-ig" value={form.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} className={field} placeholder="https://instagram.com/fch.pk" />
          </div>
          <div>
            <label className={label} htmlFor="s-fb">Facebook URL</label>
            <input id="s-fb" value={form.facebook_url} onChange={(e) => set("facebook_url", e.target.value)} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="s-tt">TikTok URL</label>
            <input id="s-tt" value={form.tiktok_url} onChange={(e) => set("tiktok_url", e.target.value)} className={field} />
          </div>
        </Section>

        <Section title="Order deadlines" hint="Applies to bank-transfer orders; unpaid orders expire automatically via the hourly cron.">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="s-upload">Upload deadline (hours)</label>
              <input
                id="s-upload"
                type="number"
                min={1}
                max={168}
                value={form.payment_upload_deadline_hours}
                onChange={(e) => set("payment_upload_deadline_hours", e.target.value)}
                className={field}
              />
            </div>
            <div>
              <label className={label} htmlFor="s-approval">Admin approval deadline (hours)</label>
              <input
                id="s-approval"
                type="number"
                min={1}
                max={168}
                value={form.payment_approval_deadline_hours}
                onChange={(e) => set("payment_approval_deadline_hours", e.target.value)}
                className={field}
              />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
