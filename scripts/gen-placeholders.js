/**
 * Generates elegant SVG placeholder images for FCH (Phase 0 seed data).
 * TODO(OWNER): replace with real product photography via Cloudinary (Phase 3+).
 * Run: bun scripts/gen-placeholders.js
 */
import { mkdirSync, writeFileSync } from "fs";

const OUT_PRODUCTS = "/home/z/my-project/public/placeholders/products";
const OUT_BANNERS = "/home/z/my-project/public/placeholders/banners";
mkdirSync(OUT_PRODUCTS, { recursive: true });
mkdirSync(OUT_BANNERS, { recursive: true });

const GOLD = "#B08D57";
const CHARCOAL = "#1A1A1A";
const IVORY = "#F8F6F2";

// per-product tonal palettes (top, bottom) — soft fashion-catalog tones
const productPalettes = {
  "kurta-ivory": ["#F1EDE5", "#DDD5C6"],
  "kurta-navy": ["#33415C", "#1B2A4A"],
  "kurta-black": ["#3A3A3A", "#141414"],
  "lawn-emerald": ["#2E6B5E", "#1F5B4E"],
  "lawn-maroon": ["#7D3040", "#6B1F2A"],
  "silk-blush": ["#EFD9D9", "#E8C4C4"],
  "maxi-gold": ["#C9A876", "#B08D57"],
  "chino-beige": ["#E4D9C3", "#D9CBB3"],
  "shirt-skyblue": ["#C5E3F0", "#87CEEB"],
  "kids-kurta": ["#EFE8DA", "#D9CBB3"],
  "lawn-mustard": ["#E5C15C", "#D4A017"],
  "banner-1": ["#23201B", "#14120F"],
  "banner-2": ["#2E2A24", "#1A1712"],
  "banner-3": ["#28303A", "#161B22"],
};

function productSvg(name, key) {
  const [top, bottom] = productPalettes[key];
  const light = ["#F1EDE5", "#DDD5C6", "#EFD9D9", "#E4D9C3", "#C5E3F0", "#EFE8DA", "#E5C15C"].includes(top);
  const textCol = light ? CHARCOAL : IVORY;
  const subCol = light ? "#8A7B5C" : "#C9B896";
  const words = name.toUpperCase();
  const fontSize = words.length > 22 ? 40 : words.length > 14 ? 52 : 64;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${top}"/>
      <stop offset="1" stop-color="${bottom}"/>
    </linearGradient>
  </defs>
  <rect width="900" height="1200" fill="url(#bg)"/>
  <!-- subtle woven texture lines -->
  <g stroke="${textCol}" stroke-width="1" opacity="0.05">
    ${Array.from({ length: 24 }, (_, i) => `<line x1="0" y1="${i * 50}" x2="900" y2="${i * 50}"/>`).join("\n    ")}
  </g>
  <rect x="36" y="36" width="828" height="1128" fill="none" stroke="${GOLD}" stroke-width="2"/>
  <rect x="48" y="48" width="804" height="1104" fill="none" stroke="${GOLD}" stroke-width="0.75" opacity="0.7"/>
  <text x="450" y="500" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" letter-spacing="6" fill="${textCol}">${words}</text>
  <g stroke="${GOLD}" stroke-width="1.5">
    <line x1="330" y1="560" x2="570" y2="560"/>
  </g>
  <text x="450" y="605" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="20" letter-spacing="8" fill="${subCol}">FASHION AND COLLECTION HOUSE</text>
  <text x="450" y="1100" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="15" letter-spacing="3" fill="${subCol}" opacity="0.8">PLACEHOLDER IMAGE — TODO: REPLACE WITH REAL PHOTO</text>
</svg>`;
}

function bannerSvg(title, subtitle, key) {
  const [top, bottom] = productPalettes[key];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="700" viewBox="0 0 1920 700">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${top}"/>
      <stop offset="1" stop-color="${bottom}"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="700" fill="url(#bg)"/>
  <g stroke="${GOLD}" stroke-width="1" opacity="0.08">
    ${Array.from({ length: 14 }, (_, i) => `<line x1="${i * 140}" y1="0" x2="${i * 140 - 200}" y2="700"/>`).join("\n    ")}
  </g>
  <rect x="60" y="60" width="1800" height="580" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="0.65"/>
  <text x="960" y="330" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="72" letter-spacing="10" fill="${IVORY}">${title.toUpperCase()}</text>
  <g stroke="${GOLD}" stroke-width="2">
    <line x1="810" y1="380" x2="1110" y2="380"/>
  </g>
  <text x="960" y="440" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" letter-spacing="6" fill="#C9B896">${subtitle}</text>
  <text x="960" y="600" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" letter-spacing="3" fill="#8A8378">FASHION AND COLLECTION HOUSE — PLACEHOLDER BANNER</text>
</svg>`;
}

const products = [
  ["premium-wash-and-wear-kurta", "Premium Wash & Wear Kurta"],
  ["embroidered-lawn-3-piece", "Embroidered Lawn 3-Piece"],
  ["silk-blend-formal-3-piece", "Silk Blend Formal"],
  ["luxury-pret-embellished-maxi", "Embellished Maxi"],
  ["classic-chino-trousers", "Classic Chino Trousers"],
  ["cotton-casual-shirt", "Cotton Casual Shirt"],
  ["kids-embroidered-kurta-set", "Kids Kurta Set"],
  ["printed-lawn-2-piece", "Printed Lawn 2-Piece"],
];

// product → palette keys (one image per color variant)
const paletteFor = {
  "premium-wash-and-wear-kurta": ["kurta-ivory", "kurta-navy", "kurta-black"],
  "embroidered-lawn-3-piece": ["lawn-emerald", "lawn-maroon"],
  "silk-blend-formal-3-piece": ["silk-blush"],
  "luxury-pret-embellished-maxi": ["maxi-gold"],
  "classic-chino-trousers": ["chino-beige"],
  "cotton-casual-shirt": ["shirt-skyblue", "chino-beige", "kurta-navy"],
  "kids-embroidered-kurta-set": ["kids-kurta", "lawn-emerald"],
  "printed-lawn-2-piece": ["lawn-mustard", "lawn-maroon"],
};

let count = 0;
for (const [slug, label] of products) {
  paletteFor[slug].forEach((key, i) => {
    const file = `${OUT_PRODUCTS}/${slug}-${i + 1}.svg`;
    writeFileSync(file, productSvg(label, key));
    count++;
  });
}

const banners = [
  ["new-season-luxury-pret", "New Season Luxury Pret", "Handcrafted elegance, delivered nationwide", "banner-1"],
  ["mid-season-sale", "Mid-Season Sale", "Up to 20% off on selected lawn", "banner-2"],
  ["free-delivery", "Free Delivery", "On all orders above Rs. 5,000", "banner-3"],
];
for (const [slug, title, sub, key] of banners) {
  writeFileSync(`${OUT_BANNERS}/${slug}.svg`, bannerSvg(title, sub, key));
  count++;
}

// category tile placeholders (Men / Women / Kids)
for (const [slug, label, key] of [["men", "Men", "kurta-navy"], ["women", "Women", "silk-blush"], ["kids", "Kids", "kids-kurta"]]) {
  writeFileSync(`${OUT_PRODUCTS}/category-${slug}.svg`, productSvg(label, key));
  count++;
}

// text-free hero backdrop (home page overlays its own live HTML text)
function heroSvg() {
  const [top, bottom] = productPalettes["banner-1"];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${top}"/>
      <stop offset="1" stop-color="${bottom}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0" stop-color="#B08D57" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#B08D57" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <rect width="1920" height="1080" fill="url(#glow)"/>
  <g stroke="#B08D57" stroke-width="1" opacity="0.07">
    ${Array.from({ length: 20 }, (_, i) => `<line x1="${i * 120}" y1="0" x2="${i * 120 - 300}" y2="1080"/>`).join("\n    ")}
  </g>
  <g stroke="#B08D57" stroke-width="1.2" opacity="0.35">
    <rect x="80" y="80" width="1760" height="920" fill="none"/>
  </g>
  <g stroke="#B08D57" stroke-width="0.75" opacity="0.22">
    <rect x="96" y="96" width="1728" height="888" fill="none"/>
  </g>
</svg>`;
}
writeFileSync(`${OUT_BANNERS}/hero.svg`, heroSvg());
count++;

console.log(`Generated ${count} placeholder SVGs.`);
