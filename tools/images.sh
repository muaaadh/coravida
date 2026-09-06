#!/bin/bash
# ==========================================================================
# CORAVIDA — image pipeline.  bash tools/images.sh
# Rebuilds every photograph from the August 2026 shoot at three widths.
# Sources live outside the repo; edit SRC if the OneDrive path moves.
# ==========================================================================
SRC="/Users/muadhhashim/Library/CloudStorage/OneDrive-SharedLibraries-Onedrive-dheemi/Dheemi/Clients/Cora Vida/Images"
D="$SRC/Safari - 001"; G="$SRC/gopro videos - 001"; P="$SRC/gopro pics - 001"
OUT="$(cd "$(dirname "$0")/.." && pwd)/assets/img"
TMP=$(mktemp -d); CVT=/opt/ImageMagick/bin/convert
mkdir -p "$OUT"

# name|max width|quality   (max width is capped at what the source can honestly give)
emit () { # $1 source file  $2 name  $3 maxw  $4 quality
  for w in 900 1600 "$3"; do
    if [ "$w" -gt "$3" ]; then continue; fi
    $CVT "$1" -auto-orient -resize "${w}x>" -strip PNG24:- 2>/dev/null \
      | cwebp -quiet -q "$4" -m 6 -sharp_yuv -o "$OUT/$2-$w.webp" -- - 2>/dev/null
  done
  big=$(ls -S "$OUT/$2"-*.webp 2>/dev/null | head -1)
  printf '  %-16s %sKB\n' "$2" "$(( $(stat -f%z "$big" 2>/dev/null || echo 0) / 1024 ))"
}
grab () { ffmpeg -v error -ss "$2" -i "$1" -frames:v 1 -update 1 -vf "$4" -y "$TMP/$3.png" 2>/dev/null; }

SHARP="unsharp=5:5:0.7:5:5:0"
BIG="scale=2800:-2:flags=lanczos,unsharp=3:3:0.45:3:3:0"

echo "· drone stills (source is a 1080p proxy — 1920 is its ceiling)"
grab "$D/dji_fly_20260828_085913_0_1788104951518_video_cache.mp4" 3   aerial-anchor   "$SHARP"
grab "$D/dji_fly_20260828_090835_0_1788104951519_video_cache.mp4" 6   aerial-underway "$SHARP"
grab "$D/dji_fly_20260828_085720_0_1788104951517_video_cache.mp4" 3   aerial-marina   "$SHARP"
grab "$D/dji_fly_20260828_090748_0_1788104951519_video_cache.mp4" 2   aerial-close    "$SHARP"
grab "$D/dji_fly_20260828_085652_0_1788104951514_video_cache.mp4" 1.5 aerial-bow      "$SHARP"
for n in aerial-anchor aerial-underway aerial-marina aerial-close aerial-bow; do emit "$TMP/$n.png" "$n" 1920 84; done

echo "· underwater (5.3K source)"
grab "$G/GX013576.MP4" 14  ray          "$BIG"
grab "$G/GX013551.MP4" 4   ray-sand     "$BIG"
grab "$G/GX013541.MP4" 5   snorkellers  "$BIG"
grab "$G/GX013507.MP4" 4   fish-tank    "$BIG"
grab "$G/GX013531.MP4" 4   reef-fish    "$BIG"
grab "$G/GX013520.MP4" 5   snorkel-reef "$BIG"
for n in ray ray-sand; do emit "$TMP/$n.png" "$n" 2200 82; done
for n in snorkellers fish-tank reef-fish snorkel-reef; do emit "$TMP/$n.png" "$n" 1600 80; done

echo "· stills (4000px GoPro / 7008px Sony)"
emit "$P/GOPR3549.JPG" vessel-guests 2800 85
emit "$P/GOPR3579.JPG" float-blue    2800 84
emit "$P/GOPR3581.JPG" swim-boat     2800 84
emit "$P/GOPR3582.JPG" boarding      2800 84
emit "$P/GOPR3632.JPG" sandbank      2800 85
emit "$P/GOPR3633.JPG" sandbank-2    2800 84
emit "$SRC/Branding/DSC00369.jpg" salon 2800 85

echo "· detail (Sony ARW embedded previews — 1616px is all they carry)"
python3 - "$D" "$TMP" <<'PY'
import sys, os, glob
src, tmp = sys.argv[1], sys.argv[2]
want = {"DSC08757": "champagne", "DSC08767": "platter", "DSC08801": "platter-macro",
        "DSC08901": "floats", "DSC08890": "floats-2", "DSC08735": "pineapple"}
for f in glob.glob(os.path.join(src, "*.ARW")):
    key = os.path.basename(f)[:-4]
    if key not in want: continue
    d = open(f, "rb").read(); best = None; i = 0
    while True:
        s = d.find(b"\xff\xd8\xff", i)
        if s < 0: break
        e = d.find(b"\xff\xd9", s)
        if e < 0: break
        seg = d[s:e+2]
        if best is None or len(seg) > len(best): best = seg
        i = e + 2
    open(os.path.join(tmp, want[key] + ".jpg"), "wb").write(best)
PY
for n in champagne platter platter-macro floats floats-2 pineapple; do emit "$TMP/$n.jpg" "$n" 1616 86; done

echo "· video posters"
grab "$D/dji_fly_20260828_090835_0_1788104951519_video_cache.mp4" 3.2  poster-hero   "$SHARP"
grab "$D/dji_fly_20260828_085913_0_1788104951518_video_cache.mp4" 0.2  poster-anchor "$SHARP"
grab "$G/GX013576.MP4"                                            10.8 poster-ray    "$BIG"
emit "$TMP/poster-hero.png"   poster-hero   1920 88
emit "$TMP/poster-anchor.png" poster-anchor 1920 88
emit "$TMP/poster-ray.png"    poster-ray    2800 88

rm -rf "$TMP"
echo "done — $(du -sh "$OUT" | cut -f1)"
