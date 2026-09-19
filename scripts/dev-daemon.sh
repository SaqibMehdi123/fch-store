#!/bin/bash
# FCH dev-server daemon wrapper — used by start-stop-daemon so the
# Next.js dev server survives between sandbox tool calls (like pg-start.sh does).
cd /home/z/my-project
exec npx next dev -p 3000
