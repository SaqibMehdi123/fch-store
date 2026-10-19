"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { submitPayment, type PaymentSubmitResult } from "@/app/actions/checkout";

/**
 * Payment screenshot upload — shown on the order page and the track-order
 * page whenever the order is awaiting_payment or payment_rejected.
 * JPG/PNG/WEBP, max 5MB; validated again server-side.
 */
export function PaymentForm({ orderNo, phone, compact }: { orderNo: string; phone: string; compact?: boolean }) {
  const [state, formAction, pending] = useActionState<PaymentSubmitResult | null, FormData>(submitPayment, null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const shownFile = state?.ok ? null : fileName; // success resets the visible choice

  useEffect(() => {
    if (state?.ok) {
      toast.success("Screenshot received — we'll verify it shortly.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="rounded-sm border border-stone bg-card p-6">
      <input type="hidden" name="orderNo" value={orderNo} />
      <input type="hidden" name="phone" value={phone} />

      <h3 className="font-display text-xl">Upload payment screenshot</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        From your bank app or receipt — showing the transferred amount.
      </p>

      <div className="mt-5 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-sender" className="label-caps mb-1.5 block">
              Sender account name
            </label>
            <input
              id="pf-sender"
              name="senderName"
              required
              placeholder="Name on the account"
              className="h-11 w-full rounded-sm border border-stone bg-background px-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold"
            />
            {state && !state.ok && state.fieldErrors?.senderName && (
              <p className="mt-1 text-xs text-destructive">{state.fieldErrors.senderName}</p>
            )}
          </div>
          <div>
            <label htmlFor="pf-ref" className="label-caps mb-1.5 block">
              Transaction ref <span className="normal-case text-muted-foreground/70">(optional)</span>
            </label>
            <input
              id="pf-ref"
              name="transactionRef"
              placeholder="e.g. 884213XXX"
              className="h-11 w-full rounded-sm border border-stone bg-background px-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
        </div>

        <div>
          <label htmlFor="pf-file" className="label-caps mb-1.5 block">
            Screenshot <span className="normal-case text-muted-foreground/70">(JPG, PNG or WEBP — max 5MB)</span>
          </label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`flex w-full items-center gap-3 rounded-sm border border-dashed px-4 py-4 text-left transition-colors focus:outline-none focus:ring-1 focus:ring-gold ${
              shownFile ? "border-gold bg-gold/5" : "border-stone bg-background hover:border-gold/60"
            }`}
          >
            <ImagePlus className={`h-5 w-5 shrink-0 ${shownFile ? "text-gold" : "text-muted-foreground"}`} strokeWidth={1.6} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{shownFile ?? "Choose screenshot"}</span>
              <span className="block text-[11.5px] text-muted-foreground">
                {shownFile ? "Tap again to change" : "From your gallery or downloads"}
              </span>
            </span>
            <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
          <input
            ref={fileRef}
            id="pf-file"
            name="screenshot"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          {state && !state.ok && state.fieldErrors?.screenshot && (
            <p className="mt-1 text-xs text-destructive">{state.fieldErrors.screenshot}</p>
          )}
        </div>
      </div>

      {state && !state.ok && state.fieldErrors === undefined && (
        <p className="mt-3 rounded-sm bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.message}</p>
      )}

      <button type="submit" disabled={pending} className="btn-luxury mt-5 w-full disabled:opacity-60">
        {pending ? (
          "Uploading…"
        ) : (
          <>
            <Upload className="mr-1.5 inline h-4 w-4" /> Submit for verification
          </>
        )}
      </button>
      {state?.ok && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Received — status is now “Payment Under Review”.
        </p>
      )}
    </form>
  );
}
