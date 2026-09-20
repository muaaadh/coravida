#!/bin/bash
# ==========================================================================
# CORAVIDA — the drone clips, enlarged.   bash tools/enhance.sh [name …]
# The drone footage only exists as the DJI app's 1080p proxies. Screens with
# more pixels than that were upscaling it themselves, softly. This cuts the
# raw clip into frames, enlarges each 2× with Real-ESRGAN (the video model,
# which keeps edges honest and frames steady), and encodes 2160 and 1440
# tiers from the result. The 1080 tier stays the untouched raw file.
# Needs ~/.local/coravida-esr/realesrgan-ncnn-vulkan (+ models/); about
# 1.5 s a frame on an Apple GPU — an hour for the five clips the site uses.
# ==========================================================================
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; OUT="$ROOT/assets/video"
ESR="$HOME/.local/coravida-esr/realesrgan-ncnn-vulkan"
[ -x "$ESR" ] || { echo "enhance: $ESR is missing"; exit 1; }
TMP="${TMPDIR:-/tmp}/cv-enhance"; mkdir -p "$TMP"
CLIPS=(${@:-vessel boat-reef boat-orbit anchor boat-harbour})
for n in "${CLIPS[@]}"; do
  src="$OUT/$n-1080.mp4"; [ -f "$src" ] || { echo "!! $n: no raw 1080 file"; continue; }
  fps=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$src" | awk -F/ '{printf "%d", $1/$2}')
  echo "· $n  ($fps fps)"
  rm -rf "$TMP/in" "$TMP/out"; mkdir -p "$TMP/in" "$TMP/out"
  ffmpeg -v error -nostdin -i "$src" -y "$TMP/in/f%05d.png" </dev/null
  "$ESR" -i "$TMP/in" -o "$TMP/out" -m "$(dirname "$ESR")/models" -n realesr-animevideov3 -s 2 -j 2:4:2 -f png >/dev/null 2>&1 || { echo "!! $n: the upscaler failed"; continue; }
  for h in 2160 1440; do
    W=$(( h * 16 / 9 )); W=$(( W - W % 2 ))
    case $h in 2160) crf=17; cap=24M; buf=48M; preset=slow ;; *) crf=17; cap=14M; buf=28M; preset=medium ;; esac
    ffmpeg -v error -nostdin -framerate "$fps" -i "$TMP/out/f%05d.png" -an \
      -vf "scale=${W}:${h}:flags=lanczos,setsar=1" \
      -c:v libx264 -profile:v high -level 5.2 -pix_fmt yuv420p -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
      -crf $crf -maxrate $cap -bufsize $buf -preset $preset -g $(( fps * 2 )) -keyint_min $fps -movflags +faststart -y "$OUT/$n-$h.mp4" </dev/null
    printf '   %-5s %6s KB\n' "$h" "$(( $(stat -f%z "$OUT/$n-$h.mp4") / 1024 ))"
  done
  rm -rf "$TMP/in" "$TMP/out"
done
echo "enhance: done"
