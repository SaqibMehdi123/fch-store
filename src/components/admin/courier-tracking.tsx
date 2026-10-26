"use client";

import { useState } from "react";
import { RefreshCcw, ExternalLink, PackageCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { COURIERS, type CourierId } from "@/lib/couriers";
import { TRACKING_STATUS_LABELS, type NormalizedStatus, type TrackingEvent } from "@/lib/tracking";

const inputCls =
  "w-full rounded-sm border border-stone bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold";
const labelCls = "mb-1 block text-[11px] uppercase tracking-[0.14em] text-muted-foreground";

const STATUS_STYLES: Record<NormalizedStatus, string> = {
  booked: "bg-stone text-foreground",
  picked_up: "bg-stone text-foreground",
  in_transit: "bg-gold/15 text-gold border border-gold/40",
  out_for_delivery: "bg-gold/15 text-gold border border-gold/40",
  delivered: "bg-emerald-100 text-emerald-800 border border-emerald-300",
  undelivered: "bg-destructive/10 text-destructive border border-destructive/40",
  returned: "bg-destructive/10 text-destructive border border-destructive/40",
  unknown: "bg-stone text-muted-foreground",
};

/** Legacy orders store free-text courier names — map them onto the registry. */
function matchCourierId(name: string, hintId?: CourierId): CourierId {
  if (hintId) return hintId;
  const n = name.trim().toLowerCase();
  if (!n) return "tcs";
  const found = COURIERS.find((c) => c.name.toLowerCase() === n || c.id === n);
  if (found) return found.id;
  if (n.includes("leopard")) return "leopards";
  if (n.includes("tcs")) return "tcs";
  if (n.includes("m&p") || n.includes("muller")) return "mp";
  if (n.includes("trax")) return "trax";
  if (n.includes("postex")) return "postex";
  if (n.includes("call")) return "callcourier";
  if (n.includes("swyft")) return "swyft";
  return "other";
}

type TrackResponse = {
  live?: boolean;
  status?: NormalizedStatus | null;
  events?: TrackingEvent[];
  message?: string | null;
  url?: string | null;
  error?: string;
};

/**
 * Shipping & tracking card — pick a courier, save the tracking number and
 * pull the delivery status inline. With courier API credentials configured
 * the status + full event timeline render here; without them the card
 * offers a one-click deep link to the courier's tracking page.
 */
export function CourierTrackingCard({
  orderNo,
  courierName,
  trackingNumber,
  trackingStatus,
  trackingEvents,
  trackingCheckedAt,
}: {
  orderNo: string;
  courierName: string | null;
  trackingNumber: string | null;
  trackingStatus: string | null;
  trackingEvents: TrackingEvent[] | null;
  trackingCheckedAt: string | null;
}) {
  const [courierId, setCourierId] = useState<CourierId>(() => matchCourierId(courierName ?? ""));
  const [tracking, setTracking] = useState(trackingNumber ?? "");
  const [status, setStatus] = useState<NormalizedStatus | null>((trackingStatus as NormalizedStatus) ?? null);
  const [events, setEvents] = useState<TrackingEvent[]>(trackingEvents ?? []);
  const [lastChecked, setLastChecked] = useState(trackingCheckedAt);
  const [live, setLive] = useState<boolean | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const courier = COURIERS.find((c) => c.id === courierId) ?? COURIERS[0];

  const check = async () => {
    if (!tracking.trim()) {
      toast.error("Enter the tracking number first.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderNo}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courierId, trackingNumber: tracking }),
      });
      const json = (await res.json()) as TrackResponse;
      if (!res.ok) throw new Error(json.error || "Tracking check failed.");

      setStatus(json.status ?? null);
      setEvents(json.events ?? []);
      setLive(Boolean(json.live));
      setNote(json.message ?? null);
      setLink(json.url ?? null);
      setLastChecked(new Date().toISOString());
      if (json.live) toast.success("Delivery status updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tracking check failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-sm border border-stone bg-card">
      <h2 className="flex items-center gap-2 border-b border-stone px-5 py-4 font-display text-lg">
        <PackageCheck className="h-4 w-4 text-gold" /> Shipping &amp; Tracking
      </h2>
      <div className="space-y-3 px-5 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor={`courier-${orderNo}`}>Courier</label>
            <select id={`courier-${orderNo}`} className={inputCls} value={courierId} onChange={(e) => setCourierId(e.target.value as CourierId)}>
              {COURIERS.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor={`tn-${orderNo}`}>Tracking number</label>
            <input
              id={`tn-${orderNo}`}
              className={inputCls}
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder={courier.hint}
            />
          </div>
        </div>

        <button
          onClick={check}
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
          {busy ? "Checking…" : "Check delivery status"}
        </button>

        {status && (
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center rounded-sm px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[status]}`}>
              {TRACKING_STATUS_LABELS[status]}
            </span>
            {lastChecked && (
              <span className="text-[11px] text-muted-foreground">
                Checked {new Date(lastChecked).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            )}
          </div>
        )}

        {events.length > 0 && (
          <ol className="space-y-0 border-l border-stone pl-4">
            {[...events].slice(0, 8).map((ev, i) => (
              <li key={i} className="relative pb-3 last:pb-0">
                <span
                  aria-hidden
                  className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${i === 0 ? "bg-gold" : "bg-stone"}`}
                />
                <p className="text-sm leading-tight">{ev.status}</p>
                <p className="text-[11px] text-muted-foreground">
                  {[ev.date, ev.location].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ol>
        )}

        {note && <p className="text-[11px] leading-relaxed text-muted-foreground">{note}</p>}

        {courier.id !== "other" && tracking.trim() && (
          <a
            href={courier.trackingUrl(tracking)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gold transition-opacity hover:opacity-80"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Track on {courier.name} website
          </a>
        )}
      </div>
    </section>
  );
}
