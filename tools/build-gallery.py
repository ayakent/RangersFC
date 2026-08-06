#!/usr/bin/env python3
"""Build the gallery manifest from whatever is sitting in assets/gallery/.

Run by the deploy workflow on every push, so adding a photo or a video to the
site is just dropping the file into that folder — no JSON to hand-edit and no
code to touch.

The caption comes from the filename: a leading date is stripped and dashes and
underscores become spaces, so

    2026-06-14-grand-finals-in-koronadal.jpg

shows up as "Grand finals in Koronadal", dated 14 June 2026.
"""

import json
import os
import re
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
GALLERY = os.path.join(ROOT, "assets", "gallery")
MANIFEST = os.path.join(GALLERY, "gallery.json")

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
VIDEO_EXT = {".mp4", ".webm", ".mov", ".m4v"}

DATE_RE = re.compile(r"^(\d{4})[-_](\d{2})[-_](\d{2})[-_ ]*")
MONTHS = ("January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December")

# Whatever the phone or Facebook called the file. These carry no meaning, so
# they are shown as no caption at all rather than as "FB IMG 1785985371206".
DUMP_RE = re.compile(r"""^(
    fb[ ]?img | img | image | photo | pic | vid | video | mov | pxl | dsc | dscn
  | mvimg | screenshot | screen[ ]?shot | signal | whatsapp | received | inbound
  | facebook | messenger | snapchat | viber | telegram | download | untitled
)\b""", re.IGNORECASE | re.VERBOSE)


def is_dump(text):
    """True when the filename is a camera or app dump, not something written."""
    if not text:
        return True
    if DUMP_RE.match(text):
        return True
    letters = sum(c.isalpha() for c in text)
    digits = sum(c.isdigit() for c in text)
    return letters == 0 or digits > letters * 2


def describe(stem):
    """Turn a filename stem into a caption and, if present, a date."""
    when = ""
    m = DATE_RE.match(stem)
    if m:
        stem = stem[m.end():]
        try:
            d = date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
            when = "%d %s %d" % (d.day, MONTHS[d.month - 1], d.year)
        except ValueError:
            when = ""
    text = re.sub(r"[-_]+", " ", stem).strip()
    text = re.sub(r"\s+", " ", text)
    if is_dump(text):
        return "", when
    return text[0].upper() + text[1:], when


def main():
    items = []
    if os.path.isdir(GALLERY):
        for name in sorted(os.listdir(GALLERY)):
            stem, ext = os.path.splitext(name)
            ext = ext.lower()
            if ext in IMAGE_EXT:
                kind = "image"
            elif ext in VIDEO_EXT:
                kind = "video"
            else:
                continue                      # gallery.json, stray files, .gitkeep
            caption, when = describe(stem)
            items.append({
                "src": "assets/gallery/" + name,
                "type": kind,
                "caption": caption,
                "date": when,
            })

    os.makedirs(GALLERY, exist_ok=True)
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump({"items": items}, f, indent=1, ensure_ascii=False)
        f.write("\n")

    photos = sum(1 for i in items if i["type"] == "image")
    videos = len(items) - photos
    print("gallery manifest: %d photo(s), %d video(s)" % (photos, videos))
    for i in items:
        print("  %-9s %s" % (i["type"], i["src"]))


if __name__ == "__main__":
    main()
