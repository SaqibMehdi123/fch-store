#!/usr/bin/env bash
# Start the sandbox-local PostgreSQL 17 (portable binaries under .pglocal/, no root).
# Auto-detects layout: Zonky (.pglocal/pg) or apt-deb extracted (.pglocal/pgroot/usr).
# Usage: bash scripts/pg-start.sh
set -e
BASE="/home/z/my-project"

# --- locate binaries + libs (whichever layout exists) ---
PGBIN=""
if [ -x "$BASE/.pglocal/pg/bin/pg_ctl" ]; then
  PGBIN="$BASE/.pglocal/pg/bin"
  LIBDIRS="$BASE/.pglocal/pg/lib"
else
  # apt layout: pgroot/usr/lib/postgresql/<major>/bin
  for d in "$BASE"/.pglocal/pgroot/usr/lib/postgresql/*/bin; do
    if [ -x "$d/pg_ctl" ]; then PGBIN="$d"; break; fi
  done
  if [ -n "$PGBIN" ]; then
    BINVERDIR="$(dirname "$PGBIN")"                        # .../pgroot/usr/lib/postgresql/<ver>
    USRLIB="$(dirname "$(dirname "$BINVERDIR")")"          # .../pgroot/usr/lib
    USR="$(dirname "$USRLIB")"                             # .../pgroot/usr
    LIBDIRS="$USRLIB/postgresql/$(basename "$BINVERDIR")/lib $USRLIB/x86_64-linux-gnu $USRLIB"
  fi
fi
if [ -z "$PGBIN" ]; then
  echo "No PostgreSQL binaries found under $BASE/.pglocal (expected Zonky or apt layout)." >&2
  exit 1
fi
for LIB in $LIBDIRS; do
  export LD_LIBRARY_PATH="$LIB${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
done
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
