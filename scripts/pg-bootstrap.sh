#!/usr/bin/env bash
# Re-bootstrap sandbox-local PostgreSQL 17 (Zonky portable binaries, no root).
# Downloads from Maven Central, extracts, starts on 127.0.0.1:5432.
set -e
BASE="/home/z/my-project"
mkdir -p "$BASE/.pglocal" && cd "$BASE/.pglocal"

VER="17.2.0"
JAR="embedded-postgres-binaries-linux-amd64-${VER}.jar"
if [ ! -f "$JAR" ]; then
  echo "[pg] downloading Zonky binaries..."
  curl -fsSL -o "$JAR" "https://repo1.maven.org/maven2/io/zonky/test/postgres/embedded-postgres-binaries-linux-amd64/${VER}/${JAR}"
fi

if [ ! -x "$BASE/.pglocal/pg/bin/pg_ctl" ]; then
  echo "[pg] extracting..."
  mkdir -p extract && cd extract
  unzip -o -q "../$JAR" postgres-linux-x86_64.txz
  tar -xJf postgres-linux-x86_64.txz
  # layout: txz may extract into ./postgres or directly into cwd
  if [ -d postgres ]; then
    mkdir -p "$BASE/.pglocal/pg" && mv postgres/* "$BASE/.pglocal/pg/"
  else
    mkdir -p "$BASE/.pglocal/pg" && mv bin lib share "$BASE/.pglocal/pg/" 2>/dev/null || true
  fi
  cd .. && rm -rf extract
fi

echo "[pg] binaries ready, starting..."
bash "$BASE/scripts/pg-start.sh"
