#!/bin/bash
# Copy the built site into the client's OneDrive folder. Only ever writes files
# this repo owns — anything the client has dropped in there survives, which a
# plain `rm -rf` of the destination would not.
DEST="/Users/muadhhashim/Library/CloudStorage/OneDrive-SharedLibraries-Onedrive-dheemi/Dheemi/Clients/Cora Vida/Web/site"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$DEST"
# rsync into OneDrive dies with "mmap: Operation timed out", so: tar, and prune
# only the paths the build generates.
for p in index.html vessel.html excursions.html gallery.html about.html contact.html \
         enquire.html 404.html sitemap.xml README.md excursions ru zh de assets tools; do
  rm -rf "$DEST/$p"
done
cd "$SRC" && tar cf - --exclude='.git' . | (cd "$DEST" && tar xf -)
echo "mirrored $(find "$SRC" -type f -not -path './.git/*' | wc -l | tr -d ' ') files into site/"
