"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitContact, type FormState } from "@/app/actions/store-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="luxury" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Sending…" : "Send message"}
    </Button>
  );
}

/**
 * Contact form — persisted to contact_messages (Admin → Phase 4 module);
 * email notification is stubbed via email_log until Phase 5.
 */
export function ContactForm() {
  const [state, formAction] = useActionState<FormState, FormData>(submitContact, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ct-name">Name *</Label>
          <Input id="ct-name" name="name" required minLength={2} maxLength={80} placeholder="Your full name" className="h-10 rounded-sm border-stone" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ct-email">Email *</Label>
          <Input id="ct-email" name="email" type="email" required placeholder="you@example.com" className="h-10 rounded-sm border-stone" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ct-phone">Phone</Label>
          <Input id="ct-phone" name="phone" type="tel" placeholder="03XX XXXXXXX" maxLength={20} className="h-10 rounded-sm border-stone" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ct-subject">Subject</Label>
          <Input id="ct-subject" name="subject" maxLength={120} placeholder="Order help, sizing, exchange…" className="h-10 rounded-sm border-stone" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ct-message">Message *</Label>
        <Textarea
          id="ct-message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={6}
          placeholder="How can we help?"
          className="rounded-sm border-stone"
        />
      </div>

      {state && (
        <p
          role="status"
          className={
            state.ok
              ? "rounded-sm bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"
              : "rounded-sm bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
