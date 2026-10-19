"use client";

import { useState } from "react";
import { Check, Copy, Landmark, Smartphone } from "lucide-react";
import { formatPKR } from "@/lib/format";

function CopyRow({
  label,
  value,
  mono,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-stone/70 py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="label-caps text-muted-foreground">{label}</p>
        <p className={`mt-0.5 truncate text-sm ${mono ? "font-mono tracking-wide" : ""}`} title={value}>
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copy ${label}`}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-stone text-muted-foreground transition-colors hover:border-gold hover:text-gold"
      >
        {copied ? <Check className="h-4 w-4 text-gold" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

/**
 * Bank transfer details — amount + IBAN up front with one-tap copy, order
 * number as the transfer reference, Raast hint. Pairs with the 3-step
 * "How to pay" strip on the order page.
 */
export function BankDetails({
  bankName,
  accountTitle,
  iban,
  total,
  orderNo,
}: {
  bankName: string;
  accountTitle: string;
  iban: string;
  total: number;
  orderNo: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      // clipboard blocked (permissions / http) — value remains selectable
    }
  };

  return (
    <div className="rounded-sm border border-stone bg-card p-6">
      <h3 className="flex items-center gap-2 font-display text-xl">
        <Landmark className="h-5 w-5 text-gold" strokeWidth={1.6} /> Transfer to
      </h3>

      {/* amount — the single most important figure */}
      <div className="mt-4 flex items-baseline justify-between gap-3 border-b border-stone/70 pb-3.5">
        <p className="label-caps text-muted-foreground">Exact amount</p>
        <p className="font-display text-2xl">{formatPKR(total)}</p>
      </div>

      {/* IBAN — full width, prominent, one-tap copy */}
      <div className="mt-3.5 rounded-sm bg-secondary/70 px-3.5 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="label-caps text-muted-foreground">IBAN</p>
          <button
            type="button"
            onClick={() => copy("IBAN", iban || "—")}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-gold transition-colors hover:text-primary"
          >
            {copied === "IBAN" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied === "IBAN" ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-1 break-all font-mono text-[13.5px] tracking-wide" title={iban}>
          {iban || "—"}
        </p>
      </div>

      <div className="mt-3">
        <CopyRow label="Bank" value={bankName || "—"} copied={copied === "Bank"} onCopy={() => copy("Bank", bankName || "—")} />
        <CopyRow label="Account title" value={accountTitle || "—"} copied={copied === "Account title"} onCopy={() => copy("Account title", accountTitle || "—")} />
        <CopyRow label="Reference" value={orderNo} mono copied={copied === "Reference"} onCopy={() => copy("Reference", orderNo)} />
      </div>

      <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
        <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        Raast transfers to this IBAN work too — screenshot the confirmation either way.
      </p>
    </div>
  );
}
