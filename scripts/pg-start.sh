#!/usr/bin/env bash
# Start the sandbox-local PostgreSQL 17 (Zonky portable binaries under .pglocal/, no root).
# Usage: bash scripts/pg-start.sh
set -e
BASE="/home/z/my-project"
# Zonky portable layout (.pglocal/pg/bin) or apt-installed layout (.pglocal/pgroot/usr/lib/postgresql/17/bin)
for CAND in "$BASE/.pglocal/pg/bin" "$BASE/.pglocal/pgroot/usr/lib/postgresql/17/bin" "/usr/lib/postgresql/17/bin"; do
  if [ -x "$CAND/pg_ctl" ]; then PGBIN="$CAND"; break; fi
done
[ -n "${PGBIN:-}" ] || { echo "no pg_ctl found" >&2; exit 1; }
PGROOT="$(dirname "$(dirname "$PGBIN")")"
export LD_LIBRARY_PATH="$PGROOT/lib:${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export PATH="$PGBIN:$PATH"
DATA="$BASE/.pglocal/data"

if "$PGBIN/pg_ctl" -D "$DATA" status >/dev/null 2>&1 || \
   timeout 2 bash -c "</dev/tcp/127.0.0.1/5432" 2>/dev/null; then
  echo "PostgreSQL already running on :5432"
  exit 0
fi

if [ ! -f "$DATA/PG_VERSION" ]; then
  echo "Initializing new cluster at $DATA ..."
  mkdir -p "$DATA" /tmp/fch-pg-sock
  "$PGBIN/initdb" -D "$DATA" -U postgres -A trust -E UTF8 >/dev/null
fi

mkdir -p /tmp/fch-pg-sock
"$PGBIN/pg_ctl" -D "$DATA" -l "$BASE/.pglocal/pg.log" \
  -o "-k /tmp/fch-pg-sock -h 127.0.0.1 -p 5432" start

for i in $(seq 1 15); do
  if timeout 2 bash -c "</dev/tcp/127.0.0.1/5432" 2>/dev/null; then
    echo "PostgreSQL is ready (TCP probe OK)."
    exit 0
  fi
  sleep 1
done
echo "PostgreSQL failed to start; see $BASE/.pglocal/pg.log" >&2
exit 1
