#!/bin/bash
# Weekly food data sync — run via cron or manually.
# Usage: 0 3 * * 0 /path/to/nutritrack/src/scripts/data-sync-cron.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
npx tsx src/scripts/data-sync.ts --source=all 2>&1 | tee -a data/sync.log
