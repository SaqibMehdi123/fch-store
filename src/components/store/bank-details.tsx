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
    <div className="flex items-center justify-between gap-3 border-b border-stone/70 py-3 last:border-0">
      <div className="min-w-0">
        <p className="label-caps">{label}</p>
        <p className={`mt-1 truncate text-sm ${mono ? "font-mono tracking-wide" : ""}`} title={value}>
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copy ${label}`}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-stone text-muted-foreground transition-colors hover:border-gold hover:text-gold"
      >
        {copied ? <Check className="h-4 w-4 text-gold" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

/**
 * Bank transfer instructions — IBAN / amount with one-tap copy, order number
 * as the transfer reference, and a Raast hint.
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
        <Landmark className="h-5 w-5 text-gold" strokeWidth={1.6} /> Bank Transfer Details
      </h3>

      <div className="mt-3">
        <CopyRow label="Bank" value={bankName || "—"} copied={copied === "Bank"} onCopy={() => copy("Bank", bankName || "—")} />
        <CopyRow label="Account title" value={accountTitle || "—"} copied={copied === "Account title"} onCopy={() => copy("Account title", accountTitle || "—")} />
        <CopyRow label="IBAN" value={iban || "—"} mono copied={copied === "IBAN"} onCopy={() => copy("IBAN", iban || "—")} />
        <CopyRow label="Exact amount" value={formatPKR(total)} copied={copied === "Exact amount"} onCopy={() => copy("Exact amount", formatPKR(total))} />
        <CopyRow label="Transfer reference" value={orderNo} mono copied={copied === "Transfer reference"} onCopy={() => copy("Transfer reference", orderNo)} />
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-sm bg-gold/10 px-3 py-2.5 text-[12.5px] leading-relaxed text-foreground/85">
        <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        Send the <strong>exact amount</strong> and use <strong>{orderNo}</strong> as the transfer reference. Raast
        transfers to this IBAN work too — screenshot the confirmation either way.
      </p>
    </div>
  );
}
