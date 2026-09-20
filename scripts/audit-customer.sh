#!/bin/bash
# FCH endpoint audit — customer-side GET sweep
BASE="http://localhost:3000"
PASS=0; FAIL=0
check() {
  local path="$1" expect="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$BASE$path")
  if [ "$code" = "$expect" ]; then
    echo "PASS $code $path"; PASS=$((PASS+1))
  else
    echo "FAIL $code (expected $expect) $path"; FAIL=$((FAIL+1))
  fi
}

echo "--- core pages ---"
check "/" 200
check "/shop" 200
check "/women" 200
check "/men" 200
check "/kids" 200
check "/cart" 200
check "/checkout" 200
check "/wishlist" 200
check "/track-order" 200
check "/about" 200
check "/contact" 200
check "/faq" 200
check "/terms" 200
check "/privacy" 200

echo "--- listing variations (filters/sort/pagination) ---"
check "/shop?category=all" 200
check "/shop?sort=price_asc" 200
check "/shop?sort=price_desc&availability=in_stock" 200
check "/shop?availability=on_sale" 200
check "/shop?min=1000&max=5000" 200
check "/shop?size=M&color=Navy" 200
check "/shop?q=kurta" 200
check "/shop?q=zzz-no-match-zzz" 200
check "/shop?page=2" 200
check "/shop?page=99" 200
check "/women?size=M" 200
check "/men?sort=price_asc&availability=in_stock" 200
check "/kids?category=boys" 200
check "/women?page=1" 200

echo "--- products (dynamic) ---"
for slug in $(curl -s "$BASE/sitemap.xml" | grep -o 'http://localhost:3000/product/[^<]*' | sed 's|.*/||'); do
  check "/product/$slug" 200
done
check "/product/does-not-exist" 404

echo "--- category legacy route ---"
check "/category/women" 200

echo "--- SEO/infra ---"
check "/sitemap.xml" 200
check "/robots.txt" 200
check "/nonexistent-page" 404
check "/admin-nonexistent" 404

echo "--- security headers spot check ---"
HDRS=$(curl -sI "$BASE/" | grep -ci -e "x-frame-options" -e "x-content-type-options" -e "referrer-policy" -e "permissions-policy")
if [ "$HDRS" -ge 4 ]; then echo "PASS headers present ($HDRS/4)"; PASS=$((PASS+1)); else echo "FAIL headers ($HDRS/4)"; FAIL=$((FAIL+1)); fi

echo ""
echo "CUSTOMER SWEEP: $PASS passed, $FAIL failed"
