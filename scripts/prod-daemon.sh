#!/bin/bash
# FCH production-server daemon wrapper — start-stop-daemon keeps the Next.js
# standalone server alive between sandbox tool calls (mirrors dev-daemon.sh).
cd /home/z/my-project
exec /usr/local/bin/bun .next/standalone/server.js >> /home/z/my-project/server.log 2>&1
