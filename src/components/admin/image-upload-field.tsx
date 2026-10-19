"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";

/**
 * Image upload field — uploads via /api/admin/upload and hands the URL back
 * to the parent form. Shows a small preview once a URL is set.
 */
export function ImageUploadField({
  value,
  onChange,
  folder = "media",
  label = "Image",
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error || "Upload failed.");
      onChange(json.url);
      toast.success("Image uploaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-stone bg-secondary">
          {value ? (
             
            <img src={value} alt="" aria-hidden className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">No image</span>
          )}
        </div>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-sm border border-stone bg-background px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            {busy ? "Uploading…" : value ? "Replace" : `Upload ${label.toLowerCase()}`}
          </button>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="…or paste an image URL"
            className="w-full rounded-sm border border-stone bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gold"
            aria-label={`${label} URL`}
          />
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <p className="text-[11px] text-muted-foreground">JPG, PNG or WebP · up to 5MB.</p>
    </div>
  );
}
