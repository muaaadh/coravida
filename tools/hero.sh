#!/bin/bash
# ==========================================================================
# CORAVIDA — hero film pipeline.  bash tools/hero.sh
# Three clips cycle in the hero. Two are 4K stock aerials, one is the real
# vessel (a 1080p DJI proxy, so 1080 is its ceiling — no 1440 tier for it).
# ==========================================================================
P="/Users/muadhhashim/Library/CloudStorage/OneDrive-SharedLibraries-Onedrive-dheemi/Dheemi/Clients/Cora Vida/Web/site/Public"
D="/Users/muadhhashim/Library/CloudStorage/OneDrive-SharedLibraries-Onedrive-dheemi/Dheemi/Clients/Cora Vida/Images/Safari - 001"
OUT="$(cd "$(dirname "$0")/.." && pwd)/assets/video"
IMG="$(cd "$(dirname "$0")/.." && pwd)/assets/img"
mkdir -p "$OUT"
CVT=/opt/ImageMagick/bin/convert

# $1 src  $2 ss  $3 dur  $4 name  $5 height  $6 crf  $7 maxrate
enc () {
  W=$(( $5 * 16 / 9 )); W=$(( W - W % 2 ))
  ffmpeg -v error -ss "$2" -t "$3" -i "$1" -an -sn -dn \
    -vf "scale=${W}:${5}:force_original_aspect_ratio=increase,crop=${W}:${5},unsharp=3:3:0.4:3:3:0,fps=25" \
    -c:v libx264 -profile:v high -level 4.2 -pix_fmt yuv420p \
    -crf "$6" -maxrate "$7" -bufsize "$(( ${7%k} * 2 ))k" \
    -preset slow -g 50 -movflags +faststart -y "$OUT/$4-$5.mp4" 2>&1 | tail -1
  printf '  %-18s %5sKB\n' "$4-$5" "$(( $(stat -f%z "$OUT/$4-$5.mp4") / 1024 ))"
}

A="$P/freepik_video_5774063.mp4"   # reef, lagoon, boats
B="$P/freepik_video_7623697.mp4"   # desert island orbit
C="$D/dji_fly_20260828_090835_0_1788104951519_video_cache.mp4"  # the real vessel

echo "· reef (4K source)"
enc "$A" 5 7 reef 1440 27 3600k
enc "$A" 5 7 reef 1080 26 2900k
enc "$A" 5 7 reef  720 27 1500k
enc "$A" 5 7 reef  540 28  800k

echo "· island (4K source)"
enc "$B" 3 7 island 1440 27 3600k
enc "$B" 3 7 island 1080 26 2900k
enc "$B" 3 7 island  720 27 1500k
enc "$B" 3 7 island  540 28  800k

echo "· vessel (1080p proxy — 1080 is its ceiling)"
enc "$C" 3.2 7 vessel 1080 25 3000k
enc "$C" 3.2 7 vessel  720 26 1600k
enc "$C" 3.2 7 vessel  540 27  850k

echo "· posters"
for spec in "reef:$A:5.2" "island:$B:3.2" "vessel:$C:3.4"; do
  n="${spec%%:*}"; rest="${spec#*:}"; src="${rest%:*}"; t="${rest##*:}"
  ffmpeg -v error -ss "$t" -i "$src" -frames:v 1 -update 1 -vf "unsharp=3:3:0.4:3:3:0" -y "/tmp/p-$n.png" 2>/dev/null
  for w in 900 1600 2400; do
    $CVT "/tmp/p-$n.png" -resize "${w}x>" -strip PNG24:- 2>/dev/null \
      | cwebp -quiet -q 86 -m 6 -sharp_yuv -o "$IMG/poster-$n-$w.webp" -- - 2>/dev/null
  done
  printf '  %-18s %5sKB\n' "poster-$n" "$(( $(stat -f%z "$IMG/poster-$n-2400.webp") / 1024 ))"
done
echo "video total: $(du -sh "$OUT" | cut -f1)"
