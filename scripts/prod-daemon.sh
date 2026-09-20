#!/bin/bash
# FCH production-server daemon — start-stop-daemon keeps the Next.js standalone
# server alive between sandbox tool calls.
# Usage: bash scripts/prod-daemon.sh start|stop|restart|status
set -u
PIDFILE=/tmp/fch-prod.pid
LOG=/home/z/my-project/server.log
APP=/home/z/my-project/.next/standalone/server.js
# The sandbox shell may export a stale DATABASE_URL (SQLite); force the real one.
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres@127.0.0.1:5432/fch}"
case "$DATABASE_URL" in
  file:*) export DATABASE_URL="postgresql://postgres@127.0.0.1:5432/fch" ;;
esac

is_up() { [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; }

case "${1:-start}" in
  start)
    if is_up; then echo "already running (pid $(cat "$PIDFILE"))"; exit 0; fi
    rm -f "$PIDFILE"
    start-stop-daemon --start --background --make-pidfile --pidfile "$PIDFILE" \
      --startas /usr/local/bin/bun -- "$APP" >> "$LOG" 2>&1
    for i in $(seq 1 20); do
      sleep 1
      code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:3000/api/health || true)
      [ "$code" = "200" ] && { echo "server up (pid $(cat "$PIDFILE"), health 200)"; exit 0; }
    done
    echo "server failed to become healthy; see $LOG" >&2
    exit 1
    ;;
  stop)
    if is_up; then
      kill "$(cat "$PIDFILE")" && rm -f "$PIDFILE" && echo "stopped"
    else
      rm -f "$PIDFILE"; echo "not running"
    fi
    ;;
  restart) "$0" stop; sleep 1; "$0" start ;;
  status)
    if is_up; then echo "running (pid $(cat "$PIDFILE"))"; else echo "not running"; exit 1; fi
    ;;
  *) echo "usage: $0 start|stop|restart|status"; exit 2 ;;
esac
