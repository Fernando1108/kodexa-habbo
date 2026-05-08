#!/bin/bash
set -e

GAMEDATA_DIR="assets/gamedata"
HABBO_BASE="https://www.habbo.com/gamedata"
# Auto-detect current PRODUCTION build from ExternalVariables, fallback to known-good
_RAW=$(curl -sL "https://www.habbo.com/gamedata/external_variables/1" 2>/dev/null | grep -o 'PRODUCTION-[0-9A-Za-z_-]*' | head -1)
GORDON_BASE="https://images.habbo.com/gordon/${_RAW:-PRODUCTION-202604282353-830745847}"
echo "ℹ️  Gordon build: ${_RAW:-PRODUCTION-202604282353-830745847}"

echo "📦 Descargando gamedata de Habbo..."
mkdir -p "$GAMEDATA_DIR"

echo "→ FurnitureData.json"
curl -sL "${HABBO_BASE}/furnidata_json/1" -o "${GAMEDATA_DIR}/FurnitureData.json" && echo "  ✅" || echo "  ⚠️ Falló"

echo "→ FigureData.xml"
curl -sL "${HABBO_BASE}/figuredata/1" -o "${GAMEDATA_DIR}/FigureData.xml" && echo "  ✅" || echo "  ⚠️ Falló"

echo "→ FigureMap.xml"
curl -sL "${GORDON_BASE}/figuremap.xml" -o "${GAMEDATA_DIR}/FigureMap.xml" && echo "  ✅" || echo "  ⚠️ Falló"

echo "→ EffectMap.xml"
curl -sL "${GORDON_BASE}/effectmap.xml" -o "${GAMEDATA_DIR}/EffectMap.xml" && echo "  ✅" || echo "  ⚠️ Falló"

echo "→ ProductData.json"
curl -sL "${HABBO_BASE}/productdata_json/1" -o "${GAMEDATA_DIR}/ProductData.json" && echo "  ✅" || echo "  ⚠️ Falló"

echo "→ ExternalTexts.json"
curl -sL "${HABBO_BASE}/external_flash_texts/1" -o "${GAMEDATA_DIR}/ExternalTexts.json" && echo "  ✅" || echo "  ⚠️ Falló"

echo "→ ExternalVariables.txt"
curl -sL "${HABBO_BASE}/external_variables/1" -o "${GAMEDATA_DIR}/ExternalVariables.txt" && echo "  ✅" || echo "  ⚠️ Falló"

echo "→ HabboAvatarActions.xml"
curl -sL "${HABBO_BASE}/HabboAvatarActions/1" -o "${GAMEDATA_DIR}/HabboAvatarActions.xml" && echo "  ✅" || echo "  ⚠️ Falló"

echo ""
echo "📊 Resumen:"
ls -lh "${GAMEDATA_DIR}/" 2>/dev/null || echo "No files"
echo ""
echo "✅ Gamedata descargado en ${GAMEDATA_DIR}/"
