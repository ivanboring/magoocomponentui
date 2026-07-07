#!/usr/bin/env bash
# Full node-bundle sweep for a list of component ids (one per line on stdin or $1 file).
# Builds → imports config → seeds nodes → renders each → reports HTTP + first error.
set -u
cd "$(dirname "$0")/.."
IDS_FILE="${1:-/dev/stdin}"
mapfile -t IDS < "$IDS_FILE"
echo "== building ${#IDS[@]} components =="
node scripts/build-vanilla.mjs "${IDS[@]}" >/tmp/sweep-build.json 2>/tmp/sweep-build.err
grep -E "FAIL|Built" /tmp/sweep-build.err
cd drupal-base
ddev drush config:import --partial --source=/var/www/html/web/themes/custom/vanilla/config/install -y >/tmp/sweep-cim.log 2>&1 && echo "config imported" || { echo "CONFIG IMPORT FAILED:"; tail -15 /tmp/sweep-cim.log; }
# CSS is not rebuilt during a sweep — missing utilities don't cause 500s, only visual gaps.
cd ..
node scripts/seed-vanilla.mjs "${IDS[@]}" > drupal-base/seed.php 2>/tmp/sweep-seed.err
grep "SEED FAIL" /tmp/sweep-seed.err
cd drupal-base
ddev drush php:eval '$s=\Drupal::entityTypeManager()->getStorage("node"); $s->delete($s->loadMultiple());' >/dev/null 2>&1
ddev drush cr >/dev/null 2>&1
ddev drush watchdog:delete all -y >/dev/null 2>&1
echo "== seeding =="
ddev drush scr seed.php 2>/tmp/sweep-scr.err > /tmp/sweep-nodes.txt
cat /tmp/sweep-scr.err | grep -i error | head -5
echo "== rendering =="
fail=0; ok=0
while IFS= read -r line; do
  bundle="${line%%:*}"; path="${line##*/node/}"
  nid="$path"
  code=$(curl -s -o /dev/null -w "%{http_code}" -k "https://drupal-base.ddev.site/node/$nid")
  if [ "$code" = "200" ]; then ok=$((ok+1)); else fail=$((fail+1)); echo "  FAIL $bundle (node/$nid) HTTP=$code"; fi
done < /tmp/sweep-nodes.txt
echo "== $ok ok, $fail failed =="
echo "== errors =="
ddev drush watchdog:show --severity=Error --count=40 --extended 2>&1 | grep -iE "Exception|Error:|component|twig|\[vanilla" | sed 's/^ *//' | sort -u | head -40
