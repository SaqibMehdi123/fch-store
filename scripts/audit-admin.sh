#!/bin/bash
# FCH endpoint audit — admin-side sweep with real NextAuth session
BASE="http://localhost:3000"
JAR="/tmp/fch-audit-cookies.txt"
PASS=0; FAIL=0
check() {
  local path="$1" expect="$2" label="${3:-}"
  local code
  code=$(curl -s -b "$JAR" -o /dev/null -w "%{http_code}" --max-time 15 "$BASE$path")
  if [ "$code" = "$expect" ]; then
    echo "PASS $code $path ${label:+($label)}"; PASS=$((PASS+1))
  else
    echo "FAIL $code (expected $expect) $path ${label:+($label)}"; FAIL=$((FAIL+1))
  fi
}

rm -f "$JAR"
echo "--- NextAuth endpoints (unauthenticated) ---"
CSRF=$(curl -s -c "$JAR" "$BASE/api/auth/csrf" | python3 -c "import sys,json; print(json.load(sys.stdin)['csrfToken'])")
check "/api/auth/csrf" 200
check "/api/auth/session" 200
check "/api/auth/providers" 200

echo "--- credential login ---"
LOGIN=$(curl -s -b "$JAR" -c "$JAR" -X POST "$BASE/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "csrfToken=$CSRF" \
  --data-urlencode "email=owner@fch.pk" \
  --data-urlencode "password=ChangeMe#2024" \
  --data-urlencode "json=true" \
  -o /dev/null -w "%{http_code}")
echo "login callback: $LOGIN"
SESSION=$(curl -s -b "$JAR" "$BASE/api/auth/session")
echo "session: $SESSION"
if echo "$SESSION" | rg -q "owner@fch.pk"; then echo "PASS session authenticated"; PASS=$((PASS+1)); else echo "FAIL session not authenticated"; FAIL=$((FAIL+1)); fi

echo "--- admin pages (authenticated) ---"
for p in "/admin" "/admin/verification" "/admin/orders" "/admin/emails" \
         "/admin/products" "/admin/products/new" "/admin/inventory" \
         "/admin/coupons" "/admin/reviews" "/admin/banners" \
         "/admin/delivery-zones" "/admin/pages" "/admin/settings" \
         "/admin/team" "/admin/reports" "/admin/unknown-module"; do
  check "$p" 200
done

echo "--- admin API (authenticated) ---"
check "/api/admin/reports?range=7d" 200 "reports"
check "/api/admin/orders/export" 200 "orders csv export"
# upload route: unauthorized without file should be 401/400 — expect 400 (bad form) with session
code=$(curl -s -b "$JAR" -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/upload")
if [ "$code" = "400" ] || [ "$code" = "415" ]; then echo "PASS $code /api/admin/upload (rejects empty upload)"; PASS=$((PASS+1)); else echo "FAIL $code /api/admin/upload (expected 400/415)"; FAIL=$((FAIL+1)); fi
# unauthenticated upload → 401
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/upload")
if [ "$code" = "401" ]; then echo "PASS 401 /api/admin/upload (unauthenticated)"; PASS=$((PASS+1)); else echo "FAIL $code /api/admin/upload unauth (expected 401)"; FAIL=$((FAIL+1)); fi

echo "--- bad login rejected ---"
rm -f /tmp/fch-bad.txt
CSRF2=$(curl -s -c /tmp/fch-bad.txt "$BASE/api/auth/csrf" | python3 -c "import sys,json; print(json.load(sys.stdin)['csrfToken'])")
BAD=$(curl -s -b /tmp/fch-bad.txt -c /tmp/fch-bad.txt -X POST "$BASE/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "csrfToken=$CSRF2" \
  --data-urlencode "email=owner@fch.pk" \
  --data-urlencode "password=wrong-password" \
  --data-urlencode "json=true" -o /dev/null -w "%{http_code}")
SESS2=$(curl -s -b /tmp/fch-bad.txt "$BASE/api/auth/session")
if ! echo "$SESS2" | rg -q "owner@fch.pk"; then echo "PASS bad credentials rejected ($BAD)"; PASS=$((PASS+1)); else echo "FAIL bad credentials accepted!"; FAIL=$((FAIL+1)); fi

echo ""
echo "ADMIN SWEEP: $PASS passed, $FAIL failed"
