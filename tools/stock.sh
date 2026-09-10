#!/bin/bash
# ==========================================================================
# CORAVIDA — the licensed stock added September 2026.
#   bash tools/stock.sh
# Encodes each clip to the tiers site.js chooses from, cuts a WebP poster,
# and builds the two stills at the same widths as the rest of the library.
# ==========================================================================
SRC="/Users/muadhhashim/Library/CloudStorage/OneDrive-SharedLibraries-Onedrive-dheemi/Dheemi/Clients/Cora Vida/Web/Stock"
OUT="$(cd "$(dirname "$0")/.." && pwd)"
V="$OUT/assets/video"; I="$OUT/assets/img"
mkdir -p "$V" "$I"

# name | file | max width | poster second | trim (start,duration)
clip () { # $1 name  $2 src  $3 maxw  $4 poster-at  $5 ss  $6 t
  local n=$1 f="$SRC/$2" max=$3 pt=$4 ss=${5:-0} du=${6:-}
  local cut=""; [ -n "$du" ] && cut="-ss $ss -t $du"
  for w in 1440 1080 720 540; do
    [ "$w" -gt "$max" ] && continue
    case $w in 1440) br=3400k ;; 1080) br=2700k ;; 720) br=1400k ;; 540) br=760k ;; esac
    ffmpeg -v error $cut -i "$f" -an \
      -vf "scale=${w}:-2:flags=lanczos,hqdn3d=1.2:1.2:4:4,unsharp=5:5:0.45:5:5:0" \
      -c:v libx264 -profile:v high -pix_fmt yuv420p -b:v $br -maxrate $((${br%k}*13/10))k \
      -bufsize $((${br%k}*2))k -preset slow -movflags +faststart -y "$V/$n-$w.mp4"
  done
  ffmpeg -v error -ss "$pt" -i "$f" -frames:v 1 -vf "scale=2400:-2:flags=lanczos,unsharp=5:5:0.6:5:5:0" -y "/tmp/cv-$n.png"
  for w in 900 1200 1600 2400; do
    [ "$w" -gt "$max" ] && [ "$w" -gt 1600 ] && continue
    /opt/ImageMagick/bin/convert "/tmp/cv-$n.png" -resize "${w}x>" -strip PNG24:- 2>/dev/null \
      | cwebp -quiet -q 84 -m 6 -sharp_yuv -o "$I/poster-$n-$w.webp" -- -
  done
  rm -f "/tmp/cv-$n.png"
  printf '  %-14s %s\n' "$n" "$(ls -S "$V/$n"-*.mp4 2>/dev/null | head -1 | xargs -I{} sh -c 'echo $(( $(stat -f%z {})/1024 ))KB')"
}

still () { # $1 name  $2 src  $3 maxw
  local n=$1 f="$SRC/$2" max=$3
  for w in 900 1200 1600 2200 2800; do
    [ "$w" -gt "$max" ] && continue
    /opt/ImageMagick/bin/convert "$f" -auto-orient -resize "${w}x>" -strip PNG24:- 2>/dev/null \
      | cwebp -quiet -q 86 -m 6 -sharp_yuv -o "$I/$n-$w.webp" -- -
  done
  printf '  %-14s %s\n' "$n" "$(ls -S "$I/$n"-*.webp 2>/dev/null | head -1 | xargs -I{} sh -c 'echo $(( $(stat -f%z {})/1024 ))KB')"
}

echo "· clips"
clip wake         "AdobeStock_354667655.mov"  1080 4
clip snorkel-pair "freepik_video_3385011.mov" 1440 4
clip sunbeams     "freepik_video_3385023.mp4" 1440 8   3 11
clip turtle       "freepik_video_5854360.mp4" 1440 3
clip mask         "freepik_video_7034368.mp4" 1440 5
clip spit         "freepik_video_966720.mp4"  1080 8   2 11
clip shark        "magnific_Video_2989730.mp4" 1440 10  5 11
clip shallows     "magnific_Video_5874349.mp4" 1440 5
echo "· stills"
still palm-beach "freepik_standard_120454065.jpg" 2800
still fins       "suntanned-woman-wearing-white-hat-sitting-beach-with-snorkel-fins-maldives-island.jpg" 2800
echo "done"
