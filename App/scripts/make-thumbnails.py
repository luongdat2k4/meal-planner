"""Builds small WebP copies of the meal and ingredient photos in public/images/thumbnails.

The originals are 1024px, several hundred KB each, but lists and cards show them at 40-300 CSS pixels. Decoding and
uploading the full image to the GPU for every card is what made scrolling stutter on phones, so the app uses these
copies everywhere except the full-screen meal photo (see thumbUrl in src/shared/assets.ts).

Run from the App folder after adding or replacing photos:  python scripts/make-thumbnails.py
Needs Pillow (pip install pillow). Existing thumbnails that are newer than their source are skipped.
"""

import os
import sys

from PIL import Image

SOURCE = os.path.join('public', 'images')
TARGET = os.path.join(SOURCE, 'thumbnails')

# prefix of the file name -> (longest side in px, WebP quality). Other images (logos, flags, ...) are small already.
RULES = {
    'assets_meals_': (480, 72),
    'assets_ingredients_': (192, 85),
}


def main() -> int:
    if not os.path.isdir(SOURCE):
        print('Run this from the App folder.', file=sys.stderr)
        return 1
    os.makedirs(TARGET, exist_ok=True)
    made = skipped = 0
    before = after = 0
    for name in sorted(os.listdir(SOURCE)):
        path = os.path.join(SOURCE, name)
        rule = next((value for prefix, value in RULES.items() if name.startswith(prefix)), None)
        if rule is None or not os.path.isfile(path) or not name.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
        out = os.path.join(TARGET, os.path.splitext(name)[0] + '.webp')
        if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(path):
            skipped += 1
            continue
        size, quality = rule
        with Image.open(path) as image:
            image = image.convert('RGBA' if image.mode in ('RGBA', 'LA', 'P') else 'RGB')
            image.thumbnail((size, size), Image.LANCZOS)
            image.save(out, 'WEBP', quality=quality, method=6)
        made += 1
        before += os.path.getsize(path)
        after += os.path.getsize(out)
    print(f'{made} thumbnails written, {skipped} up to date.')
    if made:
        print(f'{before // 1024} KB -> {after // 1024} KB ({after * 100 // before}% of the originals)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
