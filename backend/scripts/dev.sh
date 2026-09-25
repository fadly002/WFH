#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

npx concurrently -k -n gateway,employee,attendance,logger -c cyan,green,yellow,magenta \
  "npx nest start gateway --watch" \
  "npx nest start employee --watch" \
  "npx nest start attendance --watch" \
  "npx nest start logger --watch"
