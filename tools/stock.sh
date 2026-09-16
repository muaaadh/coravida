#!/bin/bash
# ==========================================================================
# CORAVIDA — the licensed stock added September 2026.
#   bash tools/stock.sh
# Builds the two licensed stills at the same widths as the rest of the
# library. The stock clips are cut by tools/film.sh with everything else.
# ==========================================================================
SRC="/Users/muadhhashim/Library/CloudStorage/OneDrive-SharedLibraries-Onedrive-dheemi/Dheemi/Clients/Cora Vida/Web/Stock"
OUT="$(cd "$(dirname "$0")/.." && pwd)"
V="$OUT/assets/video"; I="$OUT/assets/img"
mkdir -p "$V" "$I"

# (the clips are cut by tools/film.sh, with everything else that moves)

still () { # $1 name  $2 src  $3 maxw
  local n=$1 f="$SRC/$2" max=$3
  for w in 900 1200 1600 2200 2800; do
    [ "$w" -gt "$max" ] && continue
    /opt/ImageMagick/bin/convert "$f" -auto-orient -resize "${w}x>" -strip PNG24:- 2>/dev/null \
      | cwebp -quiet -q 86 -m 6 -sharp_yuv -o "$I/$n-$w.webp" -- -
  done
  printf '  %-14s %s\n' "$n" "$(ls -S "$I/$n"-*.webp 2>/dev/null | head -1 | xargs -I{} sh -c 'echo $(( $(stat -f%z {})/1024 ))KB')"
}

echo "· stills"
still palm-beach "freepik_standard_120454065.jpg" 2800
still fins       "suntanned-woman-wearing-white-hat-sitting-beach-with-snorkel-fins-maldives-island.jpg" 2800
echo "done"
