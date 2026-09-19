"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { submitReview, type FormState } from "@/app/actions/store-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="luxury" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Submitting…" : "Submit review"}
    </Button>
  );
}

function FormBody({
  productId,
  state,
  formAction,
}: {
  productId: string;
  state: FormState;
  formAction: (formData: FormData) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="rv-name">Name</Label>
          <Input id="rv-name" name="name" placeholder="Your name" required minLength={2} maxLength={60} className="h-10 rounded-sm border-stone" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rv-email">Email</Label>
          <Input id="rv-email" name="email" type="email" placeholder="you@example.com" required className="h-10 rounded-sm border-stone" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Rating</Label>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              className="rounded p-1 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "h-5 w-5 transition-colors",
                  n <= (hover || rating) ? "fill-gold text-gold" : "text-stone"
                )}
              />
            </button>
          ))}
          {rating > 0 && <span className="ml-1.5 text-xs text-muted-foreground">{rating}/5</span>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rv-title">Title (optional)</Label>
        <Input id="rv-title" name="title" placeholder="Sums it up in a line" maxLength={100} className="h-10 rounded-sm border-stone" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rv-body">Your review</Label>
        <Textarea
          id="rv-body"
          name="body"
          required
          minLength={10}
          maxLength={1000}
          rows={4}
          placeholder="Fabric, fit, stitching, delivery — what did you think?"
          className="rounded-sm border-stone"
        />
      </div>

      {state && (
        <p
          role="status"
          className={cn(
            "rounded-sm px-3 py-2 text-sm",
            state.ok ? "bg-emerald-50 text-emerald-800" : "bg-destructive/10 text-destructive"
          )}
        >
          {state.message}
        </p>
      )}

      <div className="flex items-center gap-4">
        <SubmitButton />
        <p className="text-[11px] text-muted-foreground">Reviews appear after moderation.</p>
      </div>
    </form>
  );
}

/**
 * Review submission form → moderation queue (pending). Appears on the PDP.
 * The body remounts on success only, so validation errors keep the user's text.
 */
export function ReviewForm({ productId }: { productId: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(submitReview, null);

  return (
    <FormBody
      key={state?.ok ? "done" : "editing"}
      productId={productId}
      state={state}
      formAction={formAction}
    />
  );
}
