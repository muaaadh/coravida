#!/bin/bash
# Copy the built site into the client's OneDrive folder. Only ever writes files
# this repo owns — anything the client has dropped in there survives, which a
# plain `rm -rf` of the destination would not.
DEST="${CORAVIDA_MIRROR:-/Users/muadhhashim/Library/CloudStorage/OneDrive-SharedLibraries-Onedrive-dheemi/Dheemi/Clients/Cora Vida/Web/site}"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
# on a machine without the agency's OneDrive there is nothing to mirror into
if [ ! -d "$(dirname "$DEST")" ]; then echo "mirror: $(dirname "$DEST") is not here — skipped"; exit 0; fi
mkdir -p "$DEST"
# rsync into OneDrive dies with "mmap: Operation timed out", so: tar, and prune
# only the paths the build generates.
for p in index.html vessel.html excursions.html gallery.html about.html contact.html \
         enquire.html 404.html sitemap.xml README.md excursions ru zh de assets tools admin content .github; do
  rm -rf "$DEST/$p"
done
cd "$SRC" && tar cf - --exclude='.git' . | (cd "$DEST" && tar xf -)
echo "mirrored $(find "$SRC" -type f -not -path './.git/*' | wc -l | tr -d ' ') files into site/"
