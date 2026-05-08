#!/usr/bin/env bash
# ============================================================
# Kodexa Hotel — Asset Downloader
# Downloads nitro-assets + nitro-imager into the right folders.
# Usage: bash tools/download-assets.sh
# ============================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSETS_DIR="$REPO_ROOT/assets/nitro"
TOOLS_DIR="$REPO_ROOT/tools"
IMAGER_DIR="$TOOLS_DIR/imager"

echo ""
echo "📦  Kodexa Hotel — Asset Downloader"
echo "========================================"

# ── 1. nitro-assets (furniture, clothes, effects, pets, gamedata) ──
echo ""
echo "📥  [1/2] Downloading nitro-assets..."
if [ -d "$ASSETS_DIR/.git" ]; then
  echo "     Already cloned — pulling latest..."
  git -C "$ASSETS_DIR" pull --quiet --rebase
else
  git clone --depth=1 https://github.com/sphynxkitten/nitro-assets.git "$ASSETS_DIR"
fi

echo ""
echo "📊  Asset inventory:"
total=0
for dir in furniture clothes effects pets gamedata; do
  count=$(find "$ASSETS_DIR/$dir" -type f 2>/dev/null | wc -l || echo 0)
  total=$((total + count))
  printf "     %-12s %'d files\n" "$dir:" "$count"
done
printf "     %-12s %'d files\n" "TOTAL:" "$total"

# ── 2. nitro-imager ──
echo ""
echo "🖼️   [2/2] Setting up nitro-imager..."

if [ -d "$IMAGER_DIR/.git" ]; then
  echo "     Already cloned — pulling latest..."
  git -C "$IMAGER_DIR" pull --quiet --rebase
elif [ -z "$(ls -A "$IMAGER_DIR" 2>/dev/null)" ]; then
  git clone --depth=1 https://github.com/billsonnn/nitro-imager.git "$IMAGER_DIR"
else
  echo "     ⚠️  tools/imager not empty, not a git repo — skipping clone."
  echo "        Delete tools/imager and re-run if you want a fresh install."
fi

# ── 3. Configure imager .env ──
IMAGER_ENV="$IMAGER_DIR/.env"
if [ ! -f "$IMAGER_ENV" ]; then
  if [ -f "$IMAGER_DIR/.env.example" ]; then
    echo ""
    echo "⚙️   Creating imager .env from .env.example..."
    cp "$IMAGER_DIR/.env.example" "$IMAGER_ENV"
  elif [ -d "$IMAGER_DIR" ]; then
    echo ""
    echo "⚙️   Creating minimal imager .env..."
    cat > "$IMAGER_ENV" <<EOF
NITRO_REMOTE_ASSETS_PATH=file:///assets
PORT=1338
EOF
  fi
fi

echo ""
echo "✅  Done!"
echo ""
echo "   Next steps:"
echo "   1. pnpm infra:up          — start MariaDB + Redis + Imager"
echo "   2. pnpm db:push           — apply schema to DB"
echo "   3. pnpm db:seed           — seed 7 ranks + admin user"
echo "   4. pnpm dev:web           — start CMS on localhost:3000"
echo ""
echo "   Avatar test (after infra:up):"
echo "   curl 'http://localhost:1338/habbo-imaging/avatarimage?figure=hr-115-42&size=l'"
echo ""
