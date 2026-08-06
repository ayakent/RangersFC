#!/usr/bin/env python3
"""Build the gallery manifests from whatever is sitting in assets/gallery/.

Files at the top level belong to the Rangers page. Each sub-folder is its own
gallery for one of the other pages:

    assets/gallery/              -> the Rangers home page
    assets/gallery/new-mabu/     -> the FC New Mabu page
    assets/gallery/gila/         -> the Gila page

Run by the deploy workflow on every push, so adding a photo or a video to any
page is just dropping the file into the right folder — no JSON to hand-edit and
no code to touch.

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


def collect(folder):
    """Every image and video sitting directly in one folder, in name order."""
    items = []
    if not os.path.isdir(folder):
        return items
    for name in sorted(os.listdir(folder)):
        stem, ext = os.path.splitext(name)
        ext = ext.lower()
        if ext in IMAGE_EXT:
            kind = "image"
        elif ext in VIDEO_EXT:
            kind = "video"
        else:
            continue                      # gallery.json, stray files, .gitkeep
        caption, when = describe(stem)
        rel = os.path.relpath(os.path.join(folder, name), ROOT).replace(os.sep, "/")
        items.append({"src": rel, "type": kind, "caption": caption, "date": when})
    return items


def write(folder, items, label):
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, "gallery.json"), "w", encoding="utf-8") as f:
        json.dump({"items": items}, f, indent=1, ensure_ascii=False)
        f.write("\n")
    photos = sum(1 for i in items if i["type"] == "image")
    print("%-10s %d photo(s), %d video(s)" % (label + ":", photos, len(items) - photos))
    for i in items:
        print("   %-6s %s" % (i["type"], i["src"]))


def main():
    # top level belongs to the Rangers page
    write(GALLERY, collect(GALLERY), "rangers")

    # every sub-folder is a gallery for one of the other pages
    if os.path.isdir(GALLERY):
        for name in sorted(os.listdir(GALLERY)):
            sub = os.path.join(GALLERY, name)
            if os.path.isdir(sub):
                write(sub, collect(sub), name)


if __name__ == "__main__":
    main()
