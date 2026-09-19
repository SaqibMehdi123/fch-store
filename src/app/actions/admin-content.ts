"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Phase 4 — content & marketing mutations (coupons, reviews, banners,
 * delivery zones, pages CMS, settings, team). Every action re-verifies the
 * session server-side; team management is owner-only.
 */

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized — sign in again.");
  return session;
}

async function requireOwner() {
  const session = await requireAdmin();
  if (session.user?.role !== "owner") {
    throw new Error("Only the store owner can manage team members.");
  }
  return session;
}

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

function firstIssue(error: z.ZodError): string {
  const first = error.issues[0];
  return `${first.path.join(".") || "Form"}: ${first.message}`;
}

/** Storefront + admin paths that must refresh after a settings/content change. */
function revalidateStorefront(extra: string[] = []) {
  revalidatePath("/", "layout");
  for (const p of ["/", "/shop", "/women", "/men", "/kids", "/cart", "/checkout", ...extra]) {
    revalidatePath(p);
  }
}

// ---------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------

const couponSchema = z
  .object({
    id: z.string().optional(),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "Code must be at least 3 characters.")
      .max(20, "Code must be 20 characters or fewer.")
      .regex(/^[A-Z0-9_-]+$/, "Use letters, numbers, dashes or underscores only."),
    type: z.enum(["percent", "fixed"]),
    value: z.number().min(1, "Value must be at least 1.").max(9_999_999),
    minOrderAmount: z.number().min(0).max(9_999_999).nullable().optional(),
    maxDiscount: z.number().min(1).max(9_999_999).nullable().optional(),
    startsAt: z.string().min(1, "Start date is required."),
    expiresAt: z.string().nullable().optional(),
    usageLimit: z.number().int().min(1).max(999_999).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "percent" && data.value > 90) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "Percent off cannot exceed 90." });
    }
    if (data.maxDiscount != null && data.type !== "percent") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["maxDiscount"], message: "A cap only applies to percent-off coupons." });
    }
    if (data.expiresAt && new Date(data.expiresAt) <= new Date(data.startsAt)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["expiresAt"], message: "Expiry must be after the start date." });
    }
  });

export type CouponInput = z.infer<typeof couponSchema>;

export async function upsertCoupon(raw: CouponInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = couponSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const data = parsed.data;

  const clash = await db.coupon.findUnique({ where: { code: data.code }, select: { id: true } });
  if (clash && clash.id !== data.id) return { ok: false, message: `Coupon ${data.code} already exists.` };

  const payload = {
    code: data.code,
    type: data.type,
    value: data.value,
    minOrderAmount: data.minOrderAmount ?? null,
    maxDiscount: data.type === "percent" ? data.maxDiscount ?? null : null,
    startsAt: new Date(data.startsAt),
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    usageLimit: data.usageLimit ?? null,
    isActive: data.isActive ?? true,
  };

  try {
    await db.coupon.upsert({
      where: { id: data.id ?? "" },
      update: payload,
      create: payload,
    });
  } catch {
    return { ok: false, message: "Could not save the coupon — please retry." };
  }

  revalidatePath("/admin/coupons");
  revalidatePath("/cart");
  return { ok: true, message: `Coupon ${data.code} saved.` };
}

export async function setCouponActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  await db.coupon.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/coupons");
  revalidatePath("/cart");
  return { ok: true, message: isActive ? "Coupon activated." : "Coupon deactivated." };
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  await requireAdmin();
  const used = await db.order.count({ where: { couponId: id } });
  if (used > 0) return { ok: false, message: "This coupon has been used on orders — deactivate it instead of deleting." };
  await db.coupon.delete({ where: { id } });
  revalidatePath("/admin/coupons");
  return { ok: true, message: "Coupon deleted." };
}

// ---------------------------------------------------------------
// Review moderation
// ---------------------------------------------------------------

export async function moderateReview(input: { id: string; decision: "approve" | "reject" }): Promise<ActionResult> {
  await requireAdmin();

  const review = await db.review.findUnique({
    where: { id: input.id },
    select: { id: true, product: { select: { slug: true } } },
  });
  if (!review) return { ok: false, message: "Review not found." };

  await db.review.update({
    where: { id: input.id },
    data: { status: input.decision === "approve" ? "approved" : "rejected" },
  });

  revalidatePath("/admin/reviews");
  revalidatePath(`/product/${review.product.slug}`);
  return {
    ok: true,
    message: input.decision === "approve" ? "Review approved — it now shows on the product page." : "Review rejected.",
  };
}

// ---------------------------------------------------------------
// Banners
// ---------------------------------------------------------------

const bannerSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(80),
  subtitle: z.string().trim().max(140).nullable().optional(),
  imageUrl: z.string().trim().min(1, "Add an image.").max(500),
  linkUrl: z.string().trim().max(300).nullable().optional(),
  sortOrder: z.number().int().min(0).max(999),
  isActive: z.boolean().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
});

export type BannerInput = z.infer<typeof bannerSchema>;

export async function upsertBanner(raw: BannerInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = bannerSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const data = parsed.data;

  if (data.startsAt && data.endsAt && new Date(data.endsAt) < new Date(data.startsAt)) {
    return { ok: false, message: "Schedule end must be after the start." };
  }

  const payload = {
    title: data.title,
    subtitle: data.subtitle || null,
    imageUrl: data.imageUrl,
    linkUrl: data.linkUrl || null,
    sortOrder: data.sortOrder,
    isActive: data.isActive ?? true,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    endsAt: data.endsAt ? new Date(data.endsAt) : null,
  };

  try {
    await db.banner.upsert({ where: { id: data.id ?? "" }, update: payload, create: payload });
  } catch {
    return { ok: false, message: "Could not save the banner — please retry." };
  }

  revalidatePath("/admin/banners");
  revalidateStorefront();
  return { ok: true, message: "Banner saved." };
}

export async function setBannerActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  await db.banner.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/banners");
  revalidateStorefront();
  return { ok: true, message: isActive ? "Banner published." : "Banner hidden." };
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.banner.delete({ where: { id } });
  revalidatePath("/admin/banners");
  revalidateStorefront();
  return { ok: true, message: "Banner deleted." };
}

// ---------------------------------------------------------------
// Delivery zones
// ---------------------------------------------------------------

const zoneSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(60),
  cities: z.string().trim().min(2, "List at least one city.").max(1000),
  rate: z.number().min(0, "Rate cannot be negative.").max(9_999),
  etaDays: z.number().int().min(1, "ETA must be at least 1 day.").max(30),
  isActive: z.boolean().optional(),
});

export type ZoneInput = z.infer<typeof zoneSchema>;

export async function upsertZone(raw: ZoneInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = zoneSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const data = parsed.data;

  const payload = {
    name: data.name,
    cities: data.cities,
    rate: data.rate,
    etaDays: data.etaDays,
    isActive: data.isActive ?? true,
  };

  try {
    await db.deliveryZone.upsert({ where: { id: data.id ?? "" }, update: payload, create: payload });
  } catch {
    return { ok: false, message: "Could not save the zone — please retry." };
  }

  revalidatePath("/admin/delivery-zones");
  revalidateStorefront();
  return { ok: true, message: `Zone ${data.name} saved.` };
}

export async function setZoneActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  const activeZones = await db.deliveryZone.count({ where: { isActive: true } });
  if (isActive === false && activeZones <= 1) {
    return { ok: false, message: "At least one delivery zone must stay active." };
  }
  await db.deliveryZone.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/delivery-zones");
  revalidateStorefront();
  return { ok: true, message: isActive ? "Zone activated." : "Zone deactivated." };
}

export async function deleteZone(id: string): Promise<ActionResult> {
  await requireAdmin();
  const zone = await db.deliveryZone.findUnique({ where: { id }, select: { isActive: true } });
  if (zone?.isActive) {
    const activeZones = await db.deliveryZone.count({ where: { isActive: true } });
    if (activeZones <= 1) return { ok: false, message: "At least one delivery zone must stay active." };
  }
  await db.deliveryZone.delete({ where: { id } });
  revalidatePath("/admin/delivery-zones");
  revalidateStorefront();
  return { ok: true, message: "Zone deleted." };
}

// ---------------------------------------------------------------
// Pages CMS
// ---------------------------------------------------------------

const pageSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(120),
  content: z.string().trim().min(1, "Content cannot be empty.").max(50_000),
  isActive: z.boolean().optional(),
});

export type PageInput = z.infer<typeof pageSchema>;

export async function savePage(raw: PageInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = pageSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const data = parsed.data;

  const page = await db.page.findUnique({ where: { id: data.id }, select: { slug: true } });
  if (!page) return { ok: false, message: "Page not found." };

  await db.page.update({
    where: { id: data.id },
    data: { title: data.title, content: data.content, isActive: data.isActive ?? true },
  });

  revalidatePath("/admin/pages");
  revalidateStorefront([`/${page.slug}`]);
  return { ok: true, message: `Page “${data.title}” saved.` };
}

// ---------------------------------------------------------------
// Settings
// ---------------------------------------------------------------

const SETTING_KEYS = [
  "bank_name",
  "account_title",
  "iban",
  "whatsapp_number",
  "phone",
  "email",
  "address",
  "instagram_url",
  "facebook_url",
  "tiktok_url",
  "announcement_text",
  "announcement_enabled",
  "free_shipping_threshold",
  "payment_upload_deadline_hours",
  "payment_approval_deadline_hours",
] as const;

const settingsSchema = z.object({
  bank_name: z.string().trim().max(80).default(""),
  account_title: z.string().trim().min(2, "Account title is required.").max(80),
  iban: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}[0-9A-Z]{13,32}$/, "IBAN looks invalid — use the full IBAN without spaces.")
    .or(z.literal(""))
    .default(""),
  whatsapp_number: z.string().trim().max(20).default(""),
  phone: z.string().trim().max(20).default(""),
  email: z.string().trim().email("Enter a valid email.").or(z.literal("")).default(""),
  address: z.string().trim().max(300).default(""),
  instagram_url: z.string().trim().max(300).default(""),
  facebook_url: z.string().trim().max(300).default(""),
  tiktok_url: z.string().trim().max(300).default(""),
  announcement_text: z.string().trim().max(140).default(""),
  announcement_enabled: z.boolean().default(false),
  free_shipping_threshold: z.number().min(0).max(9_999_999),
  payment_upload_deadline_hours: z.number().int().min(1).max(168),
  payment_approval_deadline_hours: z.number().int().min(1).max(168),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export async function saveSettings(raw: SettingsInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const data = parsed.data;

  const rows = SETTING_KEYS.map((key) => {
    const value = data[key];
    return { key, value: String(value) };
  });

  await db.$transaction(
    rows.map((row) =>
      db.setting.upsert({ where: { key: row.key }, update: { value: row.value }, create: row }),
    ),
  );

  // announcement bar / footer / payment screens read settings at request time
  revalidateStorefront(["/payment", "/track-order", "/order", "/contact", "/about", "/faq", "/terms", "/privacy"]);

  return { ok: true, message: "Settings saved — the storefront is updated." };
}

// ---------------------------------------------------------------
// Team (owner only)
// ---------------------------------------------------------------

const teamSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72)
    .regex(/[A-Za-z]/, "Password needs at least one letter.")
    .regex(/[0-9]/, "Password needs at least one number."),
  role: z.enum(["owner", "admin"]),
});

export async function addTeamMember(raw: { name: string; email: string; password: string; role: "owner" | "admin" }): Promise<ActionResult> {
  await requireOwner();
  const parsed = teamSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) };
  const data = parsed.data;

  const existing = await db.adminUser.findUnique({ where: { email: data.email }, select: { id: true } });
  if (existing) return { ok: false, message: "An admin with this email already exists." };

  const passwordHash = await bcrypt.hash(data.password, 12);
  await db.adminUser.create({ data: { name: data.name, email: data.email, passwordHash, role: data.role } });

  revalidatePath("/admin/team");
  return { ok: true, message: `${data.name} can now sign in as ${data.role}.` };
}

export async function removeTeamMember(id: string): Promise<ActionResult> {
  const session = await requireOwner();

  const member = await db.adminUser.findUnique({ where: { id }, select: { id: true, name: true, role: true } });
  if (!member) return { ok: false, message: "Team member not found." };
  if (member.id === session.user?.id) return { ok: false, message: "You cannot remove your own account." };

  if (member.role === "owner") {
    const owners = await db.adminUser.count({ where: { role: "owner" } });
    if (owners <= 1) return { ok: false, message: "The store must keep at least one owner." };
  }

  await db.adminUser.delete({ where: { id } });
  revalidatePath("/admin/team");
  return { ok: true, message: `${member.name} removed.` };
}

export async function resetTeamMemberPassword(input: { id: string; password: string }): Promise<ActionResult> {
  await requireOwner();
  const parsed = teamSchema.shape.password.safeParse(input.password);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const member = await db.adminUser.findUnique({ where: { id: input.id }, select: { name: true } });
  if (!member) return { ok: false, message: "Team member not found." };

  const passwordHash = await bcrypt.hash(parsed.data, 12);
  await db.adminUser.update({ where: { id: input.id }, data: { passwordHash } });
  return { ok: true, message: `Password reset for ${member.name}.` };
}

// ---------------------------------------------------------------
// Phase 5 — email log
// ---------------------------------------------------------------

/**
 * retryEmail — put a failed/queued log row back through the mailer once.
 * Safe by design: only rows not already "sent" are processed, and the
 * (order, template, dedupe) unique index prevents duplicate queueing.
 */
export async function retryEmail(id: string): Promise<ActionResult> {
  await requireAdmin();
  const row = await db.emailLog.findUnique({ where: { id }, select: { status: true } });
  if (!row) return { ok: false, message: "Email log entry not found." };
  if (row.status === "sent") return { ok: false, message: "This email was already delivered." };

  const { sendQueuedEmail } = await import("@/lib/email/send");
  const result = await sendQueuedEmail(id);
  revalidatePath("/admin/emails");
  return result.ok
    ? { ok: true, message: "Email sent." }
    : { ok: false, message: result.error ?? "Send failed — check the transport settings." };
}
