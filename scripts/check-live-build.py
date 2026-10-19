#!/usr/bin/env python3
"""Check whether the live fch-store site is serving the responsive-hardening build (99ec82b).

Marker: '100dvh-2rem' (dialog max-h class added in 99ec82b) — appears in compiled CSS
and in client JS chunks that bundle ui/dialog.
"""
import re
import subprocess
import sys

BASE = "https://fch-store.scrutinies.dev"
MARKER = "100dvh-2rem"


def fetch(url: str) -> str:
    out = subprocess.run(
        ["curl", "-s", "--max-time", "20", url],
        capture_output=True, text=True, check=True,
    )
    return out.stdout


def assets_from_html(html: str) -> list[str]:
    urls = set(re.findall(r'/_next/static/[^"\'\s>]+?\.(?:css|js)', html))
    return sorted(urls)


def check_page(path: str, label: str) -> None:
    html = fetch(f"{BASE}{path}?cb={__import__('time').int() if False else ''}" ) if False else fetch(f"{BASE}{path}")
    urls = assets_from_html(html)
    print(f"\n=== {label} ({path}) — {len(urls)} static assets ===")
    found = False
    for u in urls:
        try:
            body = fetch(BASE + u)
        except Exception as e:
            print(f"  ! fetch failed {u}: {e}")
            continue
        if MARKER in body:
            kind = "CSS" if u.endswith(".css") else "JS"
            print(f"  ✅ MARKER FOUND in {kind}: {u}")
            found = True
    if not found:
        print(f"  ❌ marker '{MARKER}' NOT in any asset of {label}")


if __name__ == "__main__":
    pages = sys.argv[1:] or ["/", "/shop", "/cart"]
    for p in pages:
        check_page(p, p)
