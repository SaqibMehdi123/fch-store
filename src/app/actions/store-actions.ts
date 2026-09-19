"use server";

/**
 * Storefront server actions — Phase 1:
 *  - submitReview: product review → moderation queue (pending)
 *  - submitContact: contact form → contact_messages (+ email_log stub)
 * Both are rate-limited per IP.
 */
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { headers } from "next/headers";
import { z } from "zod";

export type FormState = { ok: boolean; message: string } | null;

const reviewSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  name: z.string().trim().min(2, "Please enter your name").max(60),
  email: z.string().trim().email("Please enter a valid email"),
  rating: z.coerce.number().int().min(1, "Please choose a rating").max(5),
  title: z.string().trim().max(100).optional().or(z.literal("")),
  body: z.string().trim().min(10, "Review must be at least 10 characters").max(1000),
});

export async function submitReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId") ?? "",
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    rating: formData.get("rating") ?? "",
    title: formData.get("title") ?? "",
    body: formData.get("body") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const ip = clientIp(await headers());
  const rl = rateLimit(`review:${ip}`, 3, 15 * 60 * 1000);
  if (!rl.ok) {
    return { ok: false, message: `Too many reviews submitted. Try again in ${rl.retryAfterSec}s.` };
  }

  const product = await db.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true },
  });
  if (!product) return { ok: false, message: "Product not found." };

  await db.review.create({
    data: {
      productId: parsed.data.productId,
      name: parsed.data.name,
      email: parsed.data.email,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      body: parsed.data.body,
      status: "pending", // moderation queue — Admin → Reviews (Phase 4)
    },
  });

  return {
    ok: true,
    message: "Thank you! Your review has been submitted and will appear once approved.",
  };
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Please enter a valid email"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  subject: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    subject: formData.get("subject") ?? "",
    message: formData.get("message") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const ip = clientIp(await headers());
  const rl = rateLimit(`contact:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return { ok: false, message: `Too many messages sent. Try again in ${rl.retryAfterSec}s.` };
  }

  await db.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    },
  });

  // Email stub (Phase 5 wires the real sender) — queue a log entry so the
  // admin can see contact activity from day one.
  const settings = await getSettings();
  await db.emailLog.create({
    data: {
      to: settings.email,
      template: "contact_received_stub",
      status: "queued",
    },
  });

  return {
    ok: true,
    message: "Message received! Our team usually replies within a few hours.",
  };
}
