#!/bin/bash
# Weekly food data sync — run via cron or manually.
# Usage: 0 3 * * 0 /path/to/nutritrack/src/scripts/data-sync-cron.sh
set -euo pipefail
umask 077

LOCKFILE="/tmp/nutritrack-sync.lock"
exec 9>"$LOCKFILE"
flock -n 9 || { echo "Sync already running"; exit 0; }

cd "$(dirname "$0")/../.."
npx tsx src/scripts/data-sync.ts --source=all 2>&1 | tail -c 10M > data/sync.log
