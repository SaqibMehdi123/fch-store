import { getCourier, type CourierId } from "@/lib/couriers";

/**
 * Delivery-status tracking — normalised across couriers.
 *
 * `fetchTracking` is the single entry point the admin route calls. It never
 * throws: whatever happens, the caller gets a result it can render, with
 * `live: false` meaning "no API pull was possible — use the deep link".
 */

export type TrackingEvent = {
  date: string; // ISO or display string as reported by the courier
  status: string; // raw courier wording
  location?: string;
};

export type NormalizedStatus =
  | "booked"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "undelivered"
  | "returned"
  | "unknown";

export const TRACKING_STATUS_LABELS: Record<NormalizedStatus, string> = {
  booked: "Booked",
  picked_up: "Picked up",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  undelivered: "Delivery attempt failed",
  returned: "Returned to sender",
  unknown: "Unknown",
};

export type TrackingResult = {
  live: boolean; // true = pulled from the courier's API just now
  status: NormalizedStatus | null;
  events: TrackingEvent[];
  message?: string; // human-readable note when live=false
};

/** Keyword map used to normalise every courier's wording (order matters). */
const STATUS_RULES: { re: RegExp; status: NormalizedStatus }[] = [
  { re: /\breturn|\brts\b|\brt\b\s+to\s+sender/i, status: "returned" },
  { re: /out\s*for\s*(distribution|delivery)|\bofd\b/i, status: "out_for_delivery" },
  { re: /deliver/i, status: "delivered" },
  { re: /transit|moving|on\s*the\s*way|in\s*flight|dispatch|line\s*hau|departure|arrive/i, status: "in_transit" },
  { re: /pick|collect|book|received\s*at|manifest/i, status: "picked_up" },
];

const FAILURE_RE = /fail|refus|un-?success|not\s+deliver|no\s+(answer|response|person)|attempted/i;

function normalize(raw: string): NormalizedStatus {
  const text = raw.toLowerCase();
  for (const rule of STATUS_RULES) {
    if (!rule.re.test(text)) continue;
    // "attempted delivery / delivery failed" → undelivered, not delivered
    if (rule.status === "delivered" && FAILURE_RE.test(text)) return "undelivered";
    return rule.status;
  }
  return "unknown";
}

const FETCH_TIMEOUT_MS = 8000;

async function courierFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------
// Leopards — official merchant API (connect.leopardscourier.com)
// ---------------------------------------------------------------

async function fetchLeopards(
  trackingNumber: string,
  creds: { apiKey: string; apiPassword: string }
): Promise<TrackingResult> {
  const res = await courierFetch("https://connect.leopardscourier.com/api/web/Track/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: creds.apiKey,
      api_password: creds.apiPassword,
      track_number: trackingNumber,
    }),
  });
  if (!res.ok) {
    return { live: false, status: null, events: [], message: `Leopards API responded ${res.status}.` };
  }
  const json = (await res.json()) as {
    status?: string;
    error?: string;
    packet_list?: {
      book_number?: string;
      tracking_detail?: { Activity_Date?: string; Status?: string; Location?: string }[];
    }[];
  };

  const packet = json.packet_list?.[0];
  const activities = packet?.tracking_detail ?? [];
  if (!activities.length) {
    return {
      live: true,
      status: "unknown",
      events: [],
      message: json.error || "Leopards has no activity recorded for this number yet.",
    };
  }
  const events: TrackingEvent[] = activities.map((a) => ({
    date: a.Activity_Date ?? "",
    status: a.Status ?? "Update",
    location: a.Location || undefined,
  }));
  return { live: true, status: normalize(events[0].status), events };
}

// ---------------------------------------------------------------
// PostEx — merchant API (api.postex.pk), bearer token
// ---------------------------------------------------------------

async function fetchPostEx(trackingNumber: string, token: string): Promise<TrackingResult> {
  const res = await courierFetch(
    `https://api.postex.pk/services/integration/api/v1/order/track/${encodeURIComponent(trackingNumber)}`,
    { headers: { token } }
  );
  if (!res.ok) {
    return { live: false, status: null, events: [], message: `PostEx API responded ${res.status}.` };
  }
  const json = (await res.json()) as {
    statusCode?: number;
    data?: { trackingDetails?: { date?: string; status?: string; location?: string }[]; status?: string } | null;
    message?: string;
  };

  const activities = json.data?.trackingDetails ?? [];
  if (!activities.length) {
    return {
      live: true,
      status: "unknown",
      events: [],
      message: json.message || "PostEx has no tracking activity for this number yet.",
    };
  }
  const events: TrackingEvent[] = activities.map((a) => ({
    date: a.date ?? "",
    status: a.status ?? "Update",
    location: a.location || undefined,
  }));
  return { live: true, status: normalize(events[0].status), events };
}

// ---------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------

export async function fetchTracking(
  courierId: string,
  trackingNumber: string,
  creds: { leopardsApiKey: string; leopardsApiPassword: string; postexApiToken: string }
): Promise<TrackingResult> {
  const courier = getCourier(courierId);
  if (!courier || courier.id === "other" || !trackingNumber.trim()) {
    return { live: false, status: null, events: [], message: "Save a courier and tracking number first." };
  }

  try {
    if (courier.api === "leopards") {
      if (!creds.leopardsApiKey || !creds.leopardsApiPassword) {
        return {
          live: false,
          status: null,
          events: [],
          message: "Live pull needs Leopards API credentials (Settings → Courier integrations). Use the courier-site link meanwhile.",
        };
      }
      return await fetchLeopards(trackingNumber, { apiKey: creds.leopardsApiKey, apiPassword: creds.leopardsApiPassword });
    }

    if (courier.api === "postex") {
      if (!creds.postexApiToken) {
        return {
          live: false,
          status: null,
          events: [],
          message: "Live pull needs the PostEx API token (Settings → Courier integrations). Use the courier-site link meanwhile.",
        };
      }
      return await fetchPostEx(trackingNumber, creds.postexApiToken);
    }

    return {
      live: false,
      status: null,
      events: [],
      message: `${courier.name} doesn't expose a tracking API to us — use the courier-site link (or switch to Leopards/PostEx for live pulls).`,
    };
  } catch (e) {
    return {
      live: false,
      status: null,
      events: [],
      message: e instanceof Error && e.name === "AbortError"
        ? `${courier.name} took too long to respond — try again in a moment.`
        : "Could not reach the courier right now — use the courier-site link.",
    };
  }
}
