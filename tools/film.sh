#!/bin/bash
# ==========================================================================
# CORAVIDA — the film library.   bash tools/film.sh [name …]   |   --raw   |   --posters
# Every clip on the site, cut from the client's drone footage, the GoPro
# reels and the licensed stock at the source's own resolution, and encoded
# at near-transparent quality (x264 CRF 17–19 under a generous bitrate ceiling,
# no denoise, no sharpening).
# Tiers 2160 / 1440 / 1080 / 720 — never wider than the source, so a 1080p
# drone proxy stops at 1080. Each clip is a seamless loop: the last 0.6 s
# dissolve into the first, so a clip that plays longer than it lasts never
# shows a cut. Posters are the first frame of the encoded loop.
# ==========================================================================
S="/Users/muadhhashim/Library/CloudStorage/OneDrive-SharedLibraries-Onedrive-dheemi/Dheemi/Clients/Cora Vida/Web/Stock"
D="/Users/muadhhashim/Library/CloudStorage/OneDrive-SharedLibraries-Onedrive-dheemi/Dheemi/Clients/Cora Vida/Images/Safari - 001"
G="/Users/muadhhashim/Library/CloudStorage/OneDrive-SharedLibraries-Onedrive-dheemi/Dheemi/Clients/Cora Vida/Images/gopro videos - 001"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/video"; IMG="$ROOT/assets/img"
mkdir -p "$OUT" "$IMG"
F=0.6   # the dissolve that closes the loop

# name | source | start | length | max tier | frame rate
CLIPS=(
  "snorkel-pair|$S/freepik_video_3385011.mov|0|9|2160|24"
  "turtle|$S/freepik_video_5854360.mp4|0|6.7|2160|24"
  "shark|$S/magnific_Video_2989730.mp4|5|11|2160|30"
  "shallows|$S/magnific_Video_5874349.mp4|0|11|2160|30"
  "sunbeams|$S/freepik_video_3385023.mp4|3|11|2160|25"
  "ray|$G/GX013576.MP4|8|8.4|2160|30"
  # the September 20 stock — the rest of the journey the drone did not film
  "jetty|$S/freepik_video_2857218.mp4|3|11|2160|30"
  "reef-split|$S/freepik_video_548754.mp4|6|10|1080|30"
  "anchorage|$S/freepik_video_6976827.mp4|0|8.4|2160|30"
  "local-island|$S/freepik_video_737108.mp4|0|8.3|2160|24"
  "nurse-shark|$S/freepik_video_817596.mp4|0|5.1|1080|30"
  "sandbank-palms|$S/magnific_Video_8862217.mp4|0|5.8|2160|24"
  "sunset|$S/freepik_video_1056013.mp4|0|9.4|1080|24"
)

# quality first, with a ceiling well above what streaming services send at
# each size, so a noisy underwater shot cannot balloon into a file no phone streams
# The drone footage is not re-encoded at all: the bits the DJI app wrote are the
# bits the browser gets (1080p60, H.264 High). Only a cut is made, and a cut
# without re-encoding lands on the nearest keyframe (every half second here).
# No loop dissolve either — the page advances or dips at the clip's end instead.
# name | source | start | length
RAW=(
  "vessel|$D/dji_fly_20260828_090835_0_1788104951519_video_cache.mp4|3|10"
  "anchor|$D/dji_fly_20260828_085913_0_1788104951518_video_cache.mp4|0|6.6"
  "boat-drift|$D/dji_fly_20260828_085652_0_1788104951514_video_cache.mp4|0|8.6"
  "boat-blue|$D/dji_fly_20260828_085742_0_1788104951518_video_cache.mp4|0|8"
  "boat-reef|$D/dji_fly_20260828_085835_0_1788104951518_video_cache.mp4|2|10"
  "boat-orbit|$D/dji_fly_20260828_095805_0_1788104951520_video_cache.mp4|0|9.9"
  "boat-harbour|$D/dji_fly_20260828_085720_0_1788104951517_video_cache.mp4|0|7.7"
)
raw () {
  IFS='|' read -r name src ss dur <<< "$1"
  [ -f "$src" ] || { echo "!! $name: source missing — $src"; return; }
  echo "· $name  (raw copy, $dur s from $ss)"
  rm -f "$OUT/$name"-*.mp4
  ffmpeg -v error -nostdin -ss "$ss" -t "$dur" -i "$src" -c:v copy -an -sn -dn -movflags +faststart -y "$OUT/$name-1080.mp4" </dev/null
  printf '   %-5s %6s KB  %s\n' 1080 "$(( $(stat -f%z "$OUT/$name-1080.mp4") / 1024 ))" "$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,bit_rate -of csv=p=0 "$OUT/$name-1080.mp4" | tr '\n' ' ')"
  poster "$name" 1080
}

crf () { case $1 in 2160|1440) echo 17 ;; 1080) echo 18 ;; *) echo 19 ;; esac; }
cap () { case $1 in 2160) echo 24M ;; 1440) echo 14M ;; 1080) echo 9M ;; *) echo 5M ;; esac; }
buf () { case $1 in 2160) echo 48M ;; 1440) echo 28M ;; 1080) echo 18M ;; *) echo 10M ;; esac; }
one () {
  IFS='|' read -r name src ss dur max fps <<< "$1"
  [ -f "$src" ] || { echo "!! $name: source missing — $src"; return; }
  local hw=""; case "$src" in *.MP4) hw="-hwaccel videotoolbox" ;; esac   # the GoPro's 5.3K HEVC decodes in hardware
  local main; main=$(python3 -c "print(round($dur-$F,3))"); local tail; tail=$(python3 -c "print(round($dur-$F,3))")
  local loop="[0:v]trim=start=$F:end=$main,setpts=PTS-STARTPTS[m];[0:v]trim=start=$tail:end=$dur,setpts=PTS-STARTPTS[t];[0:v]trim=start=0:end=$F,setpts=PTS-STARTPTS[h];[t][h]xfade=transition=fade:duration=$F:offset=0[b];[m][b]concat=n=2:v=1:a=0,fps=$fps"
  echo "· $name  ($dur s from $ss, up to $max)"
  for h in 2160 1440 1080 720; do
    [ "$h" -gt "$max" ] && continue
    local W=$(( h * 16 / 9 )); W=$(( W - W % 2 ))
    local preset=medium; [ "$h" = "$max" ] && preset=slow
    ffmpeg -v error -nostdin $hw -ss "$ss" -t "$dur" -i "$src" -an -sn -dn \
      -filter_complex "$loop,scale=${W}:${h}:force_original_aspect_ratio=increase:flags=lanczos:out_range=tv,crop=${W}:${h},setsar=1[v]" -map "[v]" \
      -c:v libx264 -profile:v high -level 5.1 -pix_fmt yuv420p -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
      -crf "$(crf $h)" -maxrate "$(cap $h)" -bufsize "$(buf $h)" -preset $preset -g $(( fps * 2 )) -keyint_min $fps -movflags +faststart -y "$OUT/$name-$h.mp4" </dev/null
    printf '   %-5s %6s KB\n' "$h" "$(( $(stat -f%z "$OUT/$name-$h.mp4") / 1024 ))"
  done
  poster "$name" "$max"
}
# the poster is the loop's first frame, from the best tier
poster () {
  local name=$1 max=$2
  local top="$OUT/$name-$max.mp4"
  ffmpeg -v error -nostdin -i "$top" -frames:v 1 -update 1 -y "/tmp/cv-poster-$name.png" </dev/null
  for w in 900 1200 1600 2400; do
    ffmpeg -v error -nostdin -i "/tmp/cv-poster-$name.png" -vf "scale='min($w,iw)':-2:flags=lanczos" -update 1 -y "/tmp/cv-poster-$name-$w.png" </dev/null
    cwebp -quiet -q 88 -m 6 -sharp_yuv -o "$IMG/poster-$name-$w.webp" "/tmp/cv-poster-$name-$w.png"
    rm -f "/tmp/cv-poster-$name-$w.png"
  done
  rm -f "/tmp/cv-poster-$name.png"
}

if [ "$1" = "--posters" ]; then for c in "${CLIPS[@]}"; do IFS='|' read -r n _ _ _ m _ <<< "$c"; poster "$n" "$m"; echo "  poster-$n"; done; for c in "${RAW[@]}"; do poster "${c%%|*}" 1080; echo "  poster-${c%%|*}"; done; exit 0; fi
if [ "$1" = "--raw" ]; then for c in "${RAW[@]}"; do raw "$c"; done; exit 0; fi
if [ $# -gt 0 ]; then for want in "$@"; do for c in "${CLIPS[@]}"; do [ "${c%%|*}" = "$want" ] && one "$c"; done; for c in "${RAW[@]}"; do [ "${c%%|*}" = "$want" ] && raw "$c"; done; done
else for c in "${CLIPS[@]}"; do one "$c"; done; for c in "${RAW[@]}"; do raw "$c"; done; fi
echo "video total: $(du -sh "$OUT" | cut -f1)"
