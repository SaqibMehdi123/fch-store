/**
 * Generates the Phase 0 route stubs (ComingSoon placeholders).
 * Each becomes a real page in its assigned phase.
 * Run: bun scripts/gen-stubs.js
 */
import { writeFileSync } from "fs";

const base = "/home/z/my-project/src/app";
const c = (p) => `${base}/${p}/page.tsx`;

const stubs = [
  ["shop", "Shop", "Phase 1 — Customer Catalog", "Listings with sidebar filters (category tree, size, color, price, availability), sorting, search and pagination arrive in Phase 1."],
  ["wishlist", "Wishlist", "Phase 1 — Customer Catalog", "Your saved pieces, persisted on this device, arrive in Phase 1."],
  ["cart", "Shopping Cart", "Phase 2 — Cart & Checkout", "Cart with quantity editing, coupons and a free-shipping progress bar arrives in Phase 2."],
  ["about", "About Us", "Phase 1 — Static Pages", "This page will render its content from the admin-managed CMS (pages table)."],
  ["faq", "FAQ", "Phase 1 — Static Pages", "This page will render its content from the admin-managed CMS (pages table)."],
  ["terms", "Terms & Conditions", "Phase 1 — Static Pages", "This page will render its content from the admin-managed CMS (pages table)."],
  ["privacy", "Privacy Policy", "Phase 1 — Static Pages", "This page will render its content from the admin-managed CMS (pages table)."],
  ["contact", "Contact Us", "Phase 1 — Static Pages", "A contact form reaching the store by email arrives in Phase 1."],
  ["track-order", "Track Order", "Phase 2 — Cart & Checkout", "Order tracking with a status timeline and payment re-upload arrives in Phase 2."],
];

for (const [dir, title, phase, note] of stubs) {
  const body = `import { ComingSoon } from "@/components/layout/coming-soon";

export default function ${toComp(title)}Page() {
  return <ComingSoon title="${title}" phase="${phase}" note="${note}" />;
}
`;
  writeFileSync(c(dir), body);
  console.log("wrote", c(dir));
}

function toComp(title) {
  return title.replace(/[^a-zA-Z0-9]+(.)/g, (_, ch) => ch.toUpperCase()).replace(/^./, (ch) => ch.toUpperCase());
}
