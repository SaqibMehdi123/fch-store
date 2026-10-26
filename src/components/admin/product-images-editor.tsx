"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

export type ImageRow = { url: string; publicId: string };

const MAX_IMAGES = 8;

/**
 * Product images editor — pick several photos from the device (or drag them
 * in), they upload straight to the cloud (Cloudinary in production, local
 * disk fallback in dev) and land here as reorderable thumbnails. The first
 * image is the cover shown on cards and listings.
 */
export function ProductImagesEditor({
  images,
  onChange,
}: {
  images: ImageRow[];
  onChange: (images: ImageRow[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<number>(0); // files in flight
  const [dragOver, setDragOver] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");

  // Authoritative mirror during a batch: parent state re-renders lag behind
  // sequential awaits, so the accumulator lives here and re-syncs when idle.
  const imagesRef = useRef<ImageRow[]>(images);
  if (uploading === 0) imagesRef.current = images;

  const uploadFiles = async (files: File[]) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const room = MAX_IMAGES - imagesRef.current.length;
    if (room <= 0) {
      toast.error(`Up to ${MAX_IMAGES} images per product.`);
      return;
    }
    const queue = files
      .filter((f) => allowed.includes(f.type))
      .slice(0, room);
    if (!queue.length) {
      toast.error("JPG, PNG or WebP images only.");
      return;
    }
    if (files.length > room) toast.error(`Only ${room} more image${room > 1 ? "s" : ""} allowed — extra files skipped.`);

    setUploading(queue.length);
    for (const file of queue) {
      try {
        const body = new FormData();
        body.append("file", file);
        body.append("folder", "products");
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const json = (await res.json()) as { url?: string; publicId?: string; error?: string };
        if (!res.ok || !json.url) throw new Error(json.error || "Upload failed.");
        imagesRef.current = [...imagesRef.current, { url: json.url, publicId: json.publicId ?? "" }];
        onChange(imagesRef.current);
      } catch (e) {
        toast.error(`${file.name}: ${e instanceof Error ? e.message : "upload failed"}`);
      } finally {
        setUploading((n) => Math.max(0, n - 1));
      }
    }
    if (queue.length === files.length) toast.success(`${queue.length} image${queue.length > 1 ? "s" : ""} uploaded.`);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const addPasted = () => {
    const url = pasteUrl.trim();
    if (!url) return;
    if (images.length >= MAX_IMAGES) return toast.error(`Up to ${MAX_IMAGES} images per product.`);
    onChange([...images, { url, publicId: "" }]);
    setPasteUrl("");
  };

  return (
    <div>
      {/* drop zone */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void uploadFiles(Array.from(e.dataTransfer.files));
        }}
        className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-sm border border-dashed px-4 py-7 text-center transition-colors ${
          dragOver ? "border-gold bg-gold/5" : "border-stone bg-secondary/40 hover:border-gold/60"
        }`}
      >
        <UploadCloud className="h-5 w-5 text-gold" />
        <span className="text-sm font-medium">Add photos from your device</span>
        <span className="text-[11px] text-muted-foreground">
          Click to browse or drag &amp; drop · JPG, PNG, WebP · up to 5MB each · {images.length}/{MAX_IMAGES} used
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) void uploadFiles(files);
          e.target.value = "";
        }}
      />

      {/* thumbnails */}
      {(images.length > 0 || uploading > 0) && (
        <ul className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {images.map((img, i) => (
            <li key={`${img.url}-${i}`} className="group relative overflow-hidden rounded-sm border border-stone bg-secondary/60">
              <div className="relative aspect-[3/4]">
                <img src={img.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 bg-gold px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                    Cover
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-stone px-1 py-1">
                <span className="flex">
                  <button
                    type="button"
                    aria-label="Move left"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    className="p-1.5 text-muted-foreground transition-colors hover:text-gold disabled:opacity-30"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move right"
                    disabled={i === images.length - 1}
                    onClick={() => move(i, 1)}
                    className="p-1.5 text-muted-foreground transition-colors hover:text-gold disabled:opacity-30"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </span>
                <button
                  type="button"
                  aria-label={`Remove image ${i + 1}`}
                  onClick={() => onChange(images.filter((_, j) => j !== i))}
                  className="p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <li key={`uploading-${i}`} className="flex aspect-[3/4] items-center justify-center rounded-sm border border-dashed border-stone bg-secondary/40">
              <Loader2 className="h-4 w-4 animate-spin text-gold" />
            </li>
          ))}
        </ul>
      )}

      {/* paste-URL fallback */}
      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <ImagePlus className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPasted();
              }
            }}
            placeholder="…or paste an image URL and press Enter"
            className="w-full rounded-sm border border-stone bg-background py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
        <button
          type="button"
          onClick={addPasted}
          className="shrink-0 rounded-sm border border-stone px-3 text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:border-gold hover:text-gold"
        >
          Add
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        First image is the cover. Uploaded photos are stored in the cloud and reused across the store.
      </p>
    </div>
  );
}
