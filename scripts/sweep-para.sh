#!/usr/bin/env bash
# Paragraph-path sweep: build → import → seed (paragraph + host node) → render → report.
set -u
cd "$(dirname "$0")/.."
IDS_FILE="${1:-/dev/stdin}"
mapfile -t IDS < "$IDS_FILE"
echo "== building ${#IDS[@]} components as paragraphs =="
node scripts/build-para.mjs "${IDS[@]}" >/tmp/para-build.json 2>/tmp/para-build.err
grep -E "FAIL|Built" /tmp/para-build.err
cd drupal-base
ddev drush config:import --partial --source=/var/www/html/web/themes/custom/vanilla/config/install -y >/tmp/para-cim.log 2>&1 && echo "config imported" || { echo "CONFIG IMPORT FAILED:"; tail -20 /tmp/para-cim.log; }
cd ..
node scripts/seed-para.mjs "${IDS[@]}" > drupal-base/seedpara-sweep.php 2>/tmp/para-seed.err
grep "SEED FAIL" /tmp/para-seed.err
cd drupal-base
ddev drush php:eval '$n=\Drupal::entityTypeManager()->getStorage("node"); $n->delete($n->loadMultiple()); $p=\Drupal::entityTypeManager()->getStorage("paragraph"); $p->delete($p->loadMultiple());' >/dev/null 2>&1
ddev drush cr >/dev/null 2>&1
ddev drush watchdog:delete all -y >/dev/null 2>&1
echo "== seeding =="
ddev drush scr seedpara-sweep.php 2>/tmp/para-scr.err > /tmp/para-nodes.txt
grep -i error /tmp/para-scr.err | head -5
echo "== rendering =="
fail=0; ok=0
while IFS= read -r line; do
  bundle="${line%%:*}"; nid="${line##*/node/}"
  code=$(curl -s -o /dev/null -w "%{http_code}" -k "https://drupal-base.ddev.site/node/$nid")
  if [ "$code" = "200" ]; then ok=$((ok+1)); else fail=$((fail+1)); echo "  FAIL $bundle (node/$nid) HTTP=$code"; fi
done < /tmp/para-nodes.txt
echo "== $ok ok, $fail failed =="
echo "== errors =="
ddev drush watchdog:show --severity=Error --count=40 2>&1 | grep -iE "Exception|Error:|component|twig|\[vanilla" | sed 's/^ *//' | sort -u | head -40
