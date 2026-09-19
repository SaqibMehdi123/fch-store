#!/usr/bin/env bash
# Start the sandbox-local PostgreSQL 17 (extracted under .pglocal/, no root).
# Usage: bash scripts/pg-start.sh
set -e
BASE="/home/z/my-project"
PGBIN="$BASE/.pglocal/pgroot/usr/lib/postgresql/17/bin"
export LD_LIBRARY_PATH="$BASE/.pglocal/pgroot/usr/lib/x86_64-linux-gnu:$BASE/.pglocal/pgroot/usr/lib/postgresql/17/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export PATH="$PGBIN:$PATH"

if "$PGBIN/pg_isready" -h localhost -p 5432 >/dev/null 2>&1; then
  echo "PostgreSQL already running on :5432"
  exit 0
fi

mkdir -p /tmp/fch-pg-sock
"$PGBIN/pg_ctl" -D "$BASE/.pglocal/data" \
  -l "$BASE/.pglocal/pg.log" \
  -o "-k /tmp/fch-pg-sock -p 5432" \
  start

for i in $(seq 1 15); do
  if "$PGBIN/pg_isready" -h localhost -p 5432 >/dev/null 2>&1; then
    echo "PostgreSQL is ready."
    "$PGBIN/psql" -h localhost -U postgres -d fch -c "select 1;" >/dev/null 2>&1 && echo "Database 'fch' reachable."
    exit 0
  fi
  sleep 1
done
echo "PostgreSQL failed to start; see $BASE/.pglocal/pg.log" >&2
exit 1
