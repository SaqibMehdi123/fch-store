/**
 * FCH — Prisma seed script (Seed Data Pack)
 * Fashion and Collection House — Pakistani luxury clothing brand
 *
 * Idempotent: clears tables in FK-safe order, then inserts fresh data.
 * Run: bun run db:seed   (or: prisma db seed)
 *
 * NOTE: All product/banner images are local SVG placeholders.
 * TODO(OWNER): replace with real photography via Cloudinary (Admin → Products).
 */
import { PrismaClient, CouponType, ReviewStatus, AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// ---------------------------------------------------------------
// helpers
// ---------------------------------------------------------------
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const sku = (productSlug: string, color: string, size: string) =>
  `${productSlug}-${color}-${size}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-");

const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

// stock strings from the pack, e.g. "S8 M10 L10 XL8 XXL5" or "30:5 32:8" → [{size, stock}]
// Size label normalization: "OneSize" → "One Size"
const sizeLabel = (s: string) => (s === "OneSize" ? "One Size" : s);
function parseStock(spec: string): { size: string; stock: number }[] {
  return spec
    .trim()
    .split(/\s+/)
    .map((tok) => {
      const m = tok.match(/^(.+?)(\d+)$/)!; // size prefix + trailing stock digits
      return { size: sizeLabel(m[1].replace(/:$/, "")), stock: parseInt(m[2], 10) };
    });
}

// ---------------------------------------------------------------
// seed data
// ---------------------------------------------------------------
const SETTINGS: Record<string, string> = {
  bank_name: "[REPLACE — e.g., Meezan Bank]",
  account_title: "FASHION AND COLLECTION HOUSE",
  iban: "PK00XXXX0000000000000000", // TODO(OWNER): [REPLACE]
  whatsapp_number: "+92 3XX XXXXXXX", // TODO(OWNER): [REPLACE]
  phone: "+92 21 XXXXXXXX", // TODO(OWNER): [REPLACE]
  email: "orders@fch.pk", // TODO(OWNER): [REPLACE]
  address: "Shop #, Area, Karachi", // TODO(OWNER): [REPLACE]
  instagram_url: "https://instagram.com/fch.pk",
  facebook_url: "https://facebook.com/fch.pk",
  tiktok_url: "",
  announcement_text: "Free nationwide delivery on orders above Rs. 5,000",
  announcement_enabled: "true",
  free_shipping_threshold: "5000",
  payment_upload_deadline_hours: "24",
  payment_approval_deadline_hours: "48",
};

type CatSpec = [name: string, children?: CatSpec[]];
const CATEGORY_TREE: CatSpec[] = [
  [
    "Men",
    [
      ["Kurta"],
      ["Kurta Pajama"],
      ["Waistcoat"],
      ["Shalwar Kameez"],
      ["T-Shirts"],
      ["Dress Shirts"],
      ["Trousers"],
      ["Jeans"],
    ],
  ],
  [
    "Women",
    [
      ["Unstitched", [["3-Piece"], ["2-Piece"]]],
      ["Pret", [["Kurtis"], ["2-Piece"], ["3-Piece"]]],
      ["Formals"],
      ["Luxury Pret"],
    ],
  ],
  ["Kids", [["Boys"], ["Girls"]]],
];

// hierarchical slug: men / men-kurta / women-unstitched-3-piece …
function slugPath(parentSlug: string | null, name: string) {
  return parentSlug ? `${parentSlug}-${slugify(name)}` : slugify(name);
}

type VariantSpec = { color: string; hex: string; sizes: string };
type ProductSpec = {
  slug: string;
  name: string;
  category: string; // hierarchical category slug
  price: number;
  salePrice?: number;
  featured?: boolean;
  fabric: string;
  description: string;
  images: string[]; // placeholder paths, sorted
  variants: VariantSpec[];
};

const P = "/placeholders/products";

const PRODUCTS: ProductSpec[] = [
  {
    slug: "premium-wash-and-wear-kurta",
    name: "Premium Wash & Wear Kurta",
    category: "men-kurta",
    price: 3499,
    featured: true,
    fabric: "Premium wash & wear, breathable, machine washable",
    description:
      "A masterclass in understated elegance, our Premium Wash & Wear Kurta is cut from breathable premium fabric that drapes beautifully and resists wrinkles. The refined collar, neat placket and tailored side slits make it as suitable for Eid dinners as it is for everyday office wear. Machine washable and engineered to hold its crispness wash after wash, this is the workhorse kurta of a modern Pakistani wardrobe.",
    images: [`${P}/premium-wash-and-wear-kurta-1.svg`, `${P}/premium-wash-and-wear-kurta-2.svg`, `${P}/premium-wash-and-wear-kurta-3.svg`],
    variants: [
      { color: "Ivory", hex: "#F8F6F2", sizes: "S8 M10 L10 XL8 XXL5" },
      { color: "Navy", hex: "#1B2A4A", sizes: "S5 M8 L8 XL6 XXL4" },
      { color: "Black", hex: "#000000", sizes: "S6 M8 L8 XL6 XXL4" },
    ],
  },
  {
    slug: "embroidered-lawn-3-piece",
    name: "Embroidered Lawn 3-Piece (Unstitched)",
    category: "women-unstitched-3-piece",
    price: 5999,
    salePrice: 4999,
    featured: true,
    fabric: "Embroidered lawn shirt, chiffon dupatta, cambric trouser",
    description:
      "Celebrate the season in our Embroidered Lawn 3-Piece suit — an embroidered lawn shirt paired with a flowing chiffon dupatta and premium cambric trouser. Intricate threadwork across the neckline and borders brings festive polish, while breathable lawn keeps you comfortable through the longest summer day. Unstitched fabric lets you tailor every detail exactly to your taste.",
    images: [`${P}/embroidered-lawn-3-piece-1.svg`, `${P}/embroidered-lawn-3-piece-2.svg`],
    variants: [
      { color: "Emerald", hex: "#1F5B4E", sizes: "OneSize15" },
      { color: "Maroon", hex: "#6B1F2A", sizes: "OneSize12" },
    ],
  },
  {
    slug: "silk-blend-formal-3-piece",
    name: "Silk Blend Formal 3-Piece",
    category: "women-formals",
    price: 12999,
    fabric: "Silk blend shirt, embroidered neckline, organza dupatta",
    description:
      "Crafted for evenings that matter, the Silk Blend Formal 3-Piece combines a lustrous silk blend shirt with an embroidered neckline and a sheer organza dupatta that catches the light with every movement. The silhouette is graceful and modern, the detailing unapologetically luxurious. A wedding-season essential for the woman who dresses with intent.",
    images: [`${P}/silk-blend-formal-3-piece-1.svg`],
    variants: [{ color: "Blush Pink", hex: "#E8C4C4", sizes: "S3 M4 L4 XL3 XXL2" }], // low-stock demo
  },
  {
    slug: "luxury-pret-embellished-maxi",
    name: "Luxury Pret Embellished Maxi",
    category: "women-luxury-pret",
    price: 18500,
    featured: true,
    fabric: "Embellished maxi, handwork detail, inner lining",
    description:
      "Our atelier's showpiece: a floor-sweeping embellished maxi with handwork detail throughout and a fully lined interior for effortless comfort. Wear it to mehndis, walimas and formal evenings — the gold-toned embellishment photographs beautifully under any light. Produced in strictly limited quantities per size.",
    images: [`${P}/luxury-pret-embellished-maxi-1.svg`],
    variants: [{ color: "Gold", hex: "#B08D57", sizes: "S2 M2 L1 XL1" }], // low-stock demo
  },
  {
    slug: "classic-chino-trousers",
    name: "Classic Chino Trousers",
    category: "men-trousers",
    price: 2799,
    fabric: "Structured cotton twill, mid-rise, tapered leg",
    description:
      "The Classic Chino Trousers are cut from structured cotton twill with a clean, tapered leg that pairs as easily with a kurta as with an oxford shirt. A mid-rise waist, functional pockets and a crease that holds through the day make these the most versatile trousers you will own.",
    images: [`${P}/classic-chino-trousers-1.svg`],
    variants: [
      { color: "Beige", hex: "#D9CBB3", sizes: "30:5 32:8 34:8 36:6 38:4 40:2" },
      { color: "Olive", hex: "#708238", sizes: "30:4 32:6 34:6 36:5 38:3 40:2" },
      { color: "Charcoal", hex: "#36454F", sizes: "30:4 32:6 34:6 36:5 38:3 40:1" },
    ],
  },
  {
    slug: "cotton-casual-shirt",
    name: "Cotton Casual Shirt",
    category: "men-dress-shirts",
    price: 2999,
    featured: true,
    fabric: "Soft breathable cotton, pre-shrunk, easy-iron",
    description:
      "A wardrobe staple perfected: our Cotton Casual Shirt is tailored from soft, breathable pre-shrunk cotton with a structured collar and clean button placket. Easy to iron and kinder with every wash, it moves seamlessly from desk to dinner. Offered in the season's most wearable shades.",
    images: [`${P}/cotton-casual-shirt-1.svg`, `${P}/cotton-casual-shirt-2.svg`, `${P}/cotton-casual-shirt-3.svg`],
    variants: [
      { color: "Sky Blue", hex: "#87CEEB", sizes: "S6 M10 L10 XL6 XXL3" },
      { color: "White", hex: "#FFFFFF", sizes: "S5 M8 L8 XL5 XXL3" },
      { color: "Navy", hex: "#1B2A4A", sizes: "S4 M6 L6 XL4 XXL2" },
    ],
  },
  {
    slug: "kids-embroidered-kurta-set",
    name: "Kids Embroidered Kurta Set",
    category: "kids-boys",
    price: 2199,
    fabric: "Soft cotton blend, chest embroidery, comfortable fit",
    description:
      "Dress the little gentlemen in our Kids Embroidered Kurta Set — soft cotton blend fabric gentle on young skin, with delicate chest embroidery that mirrors our men's line. A comfortable, roomy fit keeps them happy through long family events, and the set photographs beautifully in the family portraits.",
    images: [`${P}/kids-embroidered-kurta-set-1.svg`, `${P}/kids-embroidered-kurta-set-2.svg`],
    variants: [
      // 10-11Y Ivory is intentionally OUT OF STOCK (demo requirement)
      { color: "Ivory", hex: "#F8F6F2", sizes: "2-3Y5 4-5Y6 6-7Y6 8-9Y4 10-11Y0" },
      { color: "Emerald", hex: "#1F5B4E", sizes: "2-3Y4 4-5Y5 6-7Y5 8-9Y3 10-11Y3" },
    ],
  },
  {
    slug: "printed-lawn-2-piece",
    name: "Printed Lawn 2-Piece",
    category: "women-unstitched-2-piece",
    price: 3499,
    salePrice: 2999,
    fabric: "Printed lawn shirt, cambric trouser",
    description:
      "Everyday elegance, printed: this 2-Piece Unstitched suit pairs a vibrantly printed lawn shirt with a matching cambric trouser. The print palette is curated for the season — warm mustards and deep rusts — and the breathable weave is made for Pakistani summers. Stitch it your way, wear it everywhere.",
    images: [`${P}/printed-lawn-2-piece-1.svg`, `${P}/printed-lawn-2-piece-2.svg`],
    variants: [
      { color: "Mustard", hex: "#D4A017", sizes: "OneSize20" },
      { color: "Rust", hex: "#B7410E", sizes: "OneSize18" },
    ],
  },
];

const ZONES: [name: string, cities: string, rate: number, eta: number][] = [
  ["Karachi", "Karachi", 120, 2],
  ["Lahore", "Lahore", 150, 2],
  ["Islamabad/Rawalpindi", "Islamabad, Rawalpindi", 150, 2],
  ["Rest of Punjab", "Faisalabad, Multan, Sialkot, Gujranwala, Sargodha, Bahawalpur, Sahiwal, DG Khan", 200, 3],
  ["Rest of Sindh", "Hyderabad, Sukkur, Larkana, Nawabshah, Mirpur", 200, 3],
  ["KPK", "Peshawar, Abbottabad, Mardan, Swat, Kohat, DI Khan", 220, 4],
  ["Balochistan", "Quetta, Gwadar, Turbat, Khuzdar", 250, 5],
  ["GB & AJK", "Gilgit, Skardu, Hunza, Muzaffarabad", 280, 6],
];

const COUPONS: {
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  usageLimit?: number;
  expiresInDays?: number;
}[] = [
  { code: "WELCOME10", type: CouponType.percent, value: 10, minOrderAmount: 2000 },
  { code: "FESTIVE500", type: CouponType.fixed, value: 500, minOrderAmount: 3000, usageLimit: 100, expiresInDays: 30 },
  { code: "FREESHIP", type: CouponType.fixed, value: 150, minOrderAmount: 1500 },
];

const PAGES: { slug: string; title: string; content: string }[] = [
  {
    slug: "about",
    title: "About Fashion and Collection House",
    content: `## Who We Are

Fashion and Collection House (FCH) is a premium Pakistani clothing brand delivering nationwide. From everyday kurtas to occasion-worthy luxury pret, every piece in our collection is chosen — and finished — with the same standard: fabrics that feel exceptional, fits that flatter, and detail work that rewards a closer look. What began as a single shop in Karachi now serves customers in every city of Pakistan.

## Our Promise

We believe luxury should be effortless to buy and a joy to receive. That is why we offer careful quality checks on every article, honest pricing with tax included, doorstep delivery across all provinces, and a customer care team that answers on WhatsApp within hours — not days. When you order from FCH, you are buying from people who wear and love the same clothes they sell.

<!-- TODO(OWNER): replace with your real brand story -->`,
  },
  {
    slug: "faq",
    title: "Frequently Asked Questions",
    content: `## How do I place an order?

Browse items, add to cart, checkout, transfer the amount to our bank account, upload the payment screenshot — after verification your order is confirmed.

## How do I pay?

Bank transfer or Raast to the IBAN shown at checkout. Use your order number as the transfer reference.

## How long does payment verification take?

Usually within 24 hours.

## How long does delivery take?

2–3 days in major cities, up to 7 days in remote areas.

## Can I pick up in store?

Yes — choose In-Store Pickup at checkout; we'll notify you when it's ready.

## How do I track my order?

Use the Track Order page with your order number and phone number.

## What is your exchange policy?

<!-- TODO(OWNER): fill in policy --> Contact us within 7 days of delivery for exchanges on unused items with tags intact.

## What if my size is out of stock?

Items restock regularly — WhatsApp us to be notified.

## Are prices inclusive of tax?

Yes, all prices are final.

## What if my payment is rejected?

You'll receive an email with the reason and a link to re-upload your payment proof within 24 hours.`,
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    content: `## 1. Acceptance of Terms

By accessing and ordering from Fashion and Collection House ("FCH"), you agree to these Terms & Conditions. If you do not agree, please do not use the website.

## 2. Orders & Payment

All orders are confirmed only after payment verification. Orders without verified payment within the stated deadline are automatically cancelled and stock is released. Prices are listed in Pakistani Rupees (PKR) and are inclusive of all applicable taxes.

## 3. Delivery

Estimated delivery times are indicative and may vary by destination and courier conditions. Risk of loss passes to the customer upon handover to the courier.

## 4. Exchanges & Returns

Exchanges are handled per the published exchange policy. Articles must be unused with original tags attached.

## 5. Contact

For any questions regarding these terms, contact us through the details listed on our Contact page.

<!-- TODO(OWNER): have this document legally reviewed before launch -->`,
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    content: `## Information We Collect

When you place an order we collect your name, phone number, email address, and delivery address. Payment screenshots you upload are used solely for payment verification.

## How We Use Your Information

Your information is used to process orders, arrange delivery, and send transactional emails about your order. We do not sell or share your personal data with third parties except the courier partners required to deliver your order.

## Data Security

Payment proofs are stored privately and are accessible only to authorized staff. We retain order records only as long as needed for legal and operational purposes.

## Your Rights

You may request correction or deletion of your personal data by contacting us through the details on our Contact page.

<!-- TODO(OWNER): have this document legally reviewed before launch -->`,
  },
];

const BANNERS: [title: string, subtitle: string, image: string, link: string][] = [
  ["New Season Luxury Pret", "Handcrafted elegance, delivered nationwide", "/placeholders/banners/new-season-luxury-pret.svg", "/category/women/luxury-pret"],
  ["Mid-Season Sale", "Up to 20% off on selected lawn", "/placeholders/banners/mid-season-sale.svg", "/shop?on_sale=1"],
  ["Free Delivery", "On all orders above Rs. 5,000", "/placeholders/banners/free-delivery.svg", "/shop"],
];

// ---------------------------------------------------------------
// main
// ---------------------------------------------------------------
async function main() {
  console.log("Seeding FCH database…");

  // ---- wipe (FK-safe order) ----
  await db.emailLog.deleteMany();
  await db.payment.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.review.deleteMany();
  await db.variant.deleteMany();
  await db.productImage.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.coupon.deleteMany();
  await db.deliveryZone.deleteMany();
  await db.banner.deleteMany();
  await db.page.deleteMany();
  await db.setting.deleteMany();
  await db.adminUser.deleteMany();

  // ---- admin owner ----
  const passwordHash = await bcrypt.hash("ChangeMe#2024", 12);
  await db.adminUser.create({
    data: { name: "Owner", email: "owner@fch.pk", passwordHash, role: AdminRole.owner },
  });
  console.log("✓ Owner admin user (owner@fch.pk / ChangeMe#2024 — change after first login)");

  // ---- settings ----
  await db.setting.createMany({ data: Object.entries(SETTINGS).map(([key, value]) => ({ key, value })) });
  console.log(`✓ ${Object.keys(SETTINGS).length} settings`);

  // ---- category tree ----
  let catCount = 0;
  async function seedCategories(
    specs: CatSpec[],
    parentSlug: string | null = null,
    parentId: string | null = null,
    sortBase = 0
  ) {
    for (let i = 0; i < specs.length; i++) {
      const [name, children] = specs[i];
      const s = slugPath(parentSlug, name);
      const created = await db.category.create({
        data: {
          name,
          slug: s,
          parentId, // ← links the tree (children inherit the created parent id)
          imageUrl: parentSlug === null ? `${P}/category-${slugify(name)}.svg` : null,
          sortOrder: sortBase + i,
        },
      });
      catCount++;
      if (children) await seedCategories(children, s, created.id);
    }
  }
  await seedCategories(CATEGORY_TREE);
  console.log(`✓ ${catCount} categories (3 top-level + children)`);

  // ---- products + images + variants ----
  const categories = await db.category.findMany({ select: { id: true, slug: true } });
  const catId = new Map(categories.map((c) => [c.slug, c.id]));

  let variantCount = 0;
  for (const p of PRODUCTS) {
    await db.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        categoryId: catId.get(p.category)!,
        description: p.description,
        fabricDetails: p.fabric,
        price: p.price,
        salePrice: p.salePrice ?? null,
        isFeatured: !!p.featured,
        isActive: true,
        images: {
          create: p.images.map((url, i) => ({ url, sortOrder: i })), // publicId: null — local placeholder
        },
        variants: {
          create: p.variants.flatMap((v) =>
            parseStock(v.sizes).map(({ size, stock }) => ({
              colorName: v.color,
              colorHex: v.hex,
              size,
              stock,
              sku: sku(p.slug, v.color, size),
            }))
          ),
        },
      },
    });
    variantCount += p.variants.reduce((n, v) => n + parseStock(v.sizes).length, 0);
  }
  console.log(`✓ ${PRODUCTS.length} products with ${variantCount} variants`);

  // ---- delivery zones ----
  await db.deliveryZone.createMany({
    data: ZONES.map(([name, cities, rate, etaDays]) => ({ name, cities, rate, etaDays, isActive: true })),
  });
  console.log(`✓ ${ZONES.length} delivery zones (in-store pickup enabled at checkout — no fee)`);

  // ---- coupons ----
  await db.coupon.createMany({
    data: COUPONS.map((c) => ({
      code: c.code,
      type: c.type,
      value: c.value,
      minOrderAmount: c.minOrderAmount ?? null,
      usageLimit: c.usageLimit ?? null,
      expiresAt: c.expiresInDays ? daysFromNow(c.expiresInDays) : null,
      isActive: true,
    })),
  });
  console.log(`✓ ${COUPONS.length} coupons (WELCOME10, FESTIVE500, FREESHIP)`);

  // ---- banners ----
  await db.banner.createMany({
    data: BANNERS.map(([title, subtitle, imageUrl, linkUrl], i) => ({
      title,
      subtitle,
      imageUrl,
      linkUrl,
      sortOrder: i,
      isActive: true,
    })),
  });
  console.log(`✓ ${BANNERS.length} banners`);

  // ---- pages ----
  await db.page.createMany({ data: PAGES });
  console.log(`✓ ${PAGES.length} pages (about, faq, terms, privacy)`);

  // ---- reviews ----
  const pid = new Map((await db.product.findMany({ select: { id: true, slug: true } })).map((p) => [p.slug, p.id]));
  await db.review.createMany({
    data: [
      {
        productId: pid.get("premium-wash-and-wear-kurta")!,
        name: "Ahmed R.",
        email: "ahmed.r@example.com",
        rating: 5,
        title: "Excellent quality",
        body: "Excellent fabric quality, exactly as described. Highly recommended.",
        isVerifiedPurchase: true,
        status: ReviewStatus.approved,
      },
      {
        productId: pid.get("premium-wash-and-wear-kurta")!,
        name: "Bilal K.",
        email: "bilal.k@example.com",
        rating: 4,
        title: "Comfortable fit",
        body: "Good stitching and comfortable fit. Delivery took 3 days.",
        isVerifiedPurchase: true,
        status: ReviewStatus.approved,
      },
      {
        productId: pid.get("embroidered-lawn-3-piece")!,
        name: "Ayesha S.",
        email: "ayesha.s@example.com",
        rating: 5,
        title: "Beautiful embroidery",
        body: "Beautiful embroidery, lawn quality is premium. Will order again.",
        isVerifiedPurchase: true,
        status: ReviewStatus.approved,
      },
      {
        // pending — moderation demo (Admin → Reviews in Phase 4)
        productId: pid.get("premium-wash-and-wear-kurta")!,
        name: "Usman T.",
        email: "usman.t@example.com",
        rating: 4,
        title: "Great product",
        body: "Delivery was a bit slow but the product is great.",
        isVerifiedPurchase: false,
        status: ReviewStatus.pending,
      },
    ],
  });
  console.log("✓ 4 reviews (3 approved + 1 pending for moderation demo)");

  // ---- verification summary ----
  const [admins, settings, cats, prods, imgs, vars, zones, coups, bans, pgs, revs] = await Promise.all([
    db.adminUser.count(),
    db.setting.count(),
    db.category.count(),
    db.product.count(),
    db.productImage.count(),
    db.variant.count(),
    db.deliveryZone.count(),
    db.coupon.count(),
    db.banner.count(),
    db.page.count(),
    db.review.count(),
  ]);
  console.log("\n─── Seed verification (row counts) ───");
  console.table({
    admin_users: admins,
    settings: settings,
    categories: cats,
    products: prods,
    product_images: imgs,
    variants: vars,
    delivery_zones: zones,
    coupons: coups,
    banners: bans,
    pages: pgs,
    reviews: revs,
    orders: 0,
    order_items: 0,
    payments: 0,
    email_log: 0,
  });

  const oos = await db.variant.findFirst({ where: { stock: 0 }, select: { sku: true } });
  const low = await db.variant.count({ where: { stock: { lte: 3, gt: 0 } } });
  console.log(`Out-of-stock demo variant: ${oos?.sku ?? "MISSING!"}`);
  console.log(`Low-stock variants (1–3 units): ${low}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
