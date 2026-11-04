"""Convert the JPG/PNG images in App/public/images to WebP.

Output goes to <repo>/ims-tmp, one file per source with the same base name (foo.jpg -> foo.webp).
Sources are left untouched. Usage: python App/scripts/to-webp.py [quality=80]
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'App' / 'public' / 'images'
OUT = ROOT / 'ims-tmp'
quality = int(sys.argv[1]) if len(sys.argv) > 1 else 80

OUT.mkdir(exist_ok=True)
sources = sorted(p for p in SRC.iterdir() if p.suffix.lower() in ('.jpg', '.jpeg', '.png'))

stems = [p.stem for p in sources]
dupes = {s for s in stems if stems.count(s) > 1}
if dupes:
    sys.exit(f'Same name with different extensions, would overwrite: {sorted(dupes)[:5]}')

before = after = 0
for p in sources:
    target = OUT / f'{p.stem}.webp'
    with Image.open(p) as im:
        # PNG logos keep their transparency; WebP handles RGBA natively.
        im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
        im.save(target, 'WEBP', quality=quality, method=6)
    before += p.stat().st_size
    after += target.stat().st_size

print(f'{len(sources)} files: {before / 1048576:.1f} MB -> {after / 1048576:.1f} MB (quality {quality}) in {OUT}')
