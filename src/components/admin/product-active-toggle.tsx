"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setProductActive } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

/** Live/hidden switch on the products table. */
export function ProductActiveToggle({ id, name, isActive }: { id: string; name: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      const res = await setProductActive(id, !isActive);
      if (res.ok) {
        toast.success(`${name}: ${res.message}`);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={isActive}
      aria-label={`${isActive ? "Hide" : "Publish"} ${name}`}
      className={cn(
        "relative inline-flex h-5.5 w-10 items-center rounded-full border transition-colors disabled:opacity-50",
        isActive ? "border-gold/50 bg-gold/80" : "border-stone bg-stone/60"
      )}
    >
      <span
        className={cn(
          "absolute h-4 w-4 rounded-full bg-white shadow transition-all",
          isActive ? "left-[calc(100%-1.25rem)]" : "left-0.5"
        )}
      />
      <span className="sr-only">{isActive ? "Live" : "Hidden"}</span>
    </button>
  );
}
