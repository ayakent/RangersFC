# Rangers Football Club

The website for Rangers Football Club — a grassroots football club in Yam 1, Purok 27,
Barangay Mabuhay, General Santos City, founded 14 June 1996.

**Play with your heart.**

**Live:** [rangersfc.net](https://rangersfc.net/) · the game at [rangersfc.net/game](https://rangersfc.net/game/)

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | The club website. One self-contained page: markup, styles and scripts. |
| `game/index.html` | *SKY: Soccer Quest*, the club's side-scrolling football game. |
| `new-mabu/index.html` | FC New Mabu — sister team at New Mabuhay Elementary School. |
| `gila/index.html` | Gila — the skills academy. |
| `shop/index.html` | Club shop for all three teams. |
| `assets/shop/shop.json` | The shop's stock. Edit this to change items, prices and sizes. |
| `assets/team.css`, `assets/team.js` | Shared kit behind the three pages above. |
| `assets/` | Club crest, favicon, the game still, the share card and the squad photo. |
| `assets/gallery/` | Whatever you upload. Feeds the *From the Pitch* slideshow. |
| `tools/build-gallery.py` | Turns that folder into the gallery manifest at deploy time. |
| `vendor/three.min.js` | three.js r128, used by the hero scene (MIT — see `vendor/three.LICENSE`). |

## The page

A single scroll, staged like a short film.

- **Title sequence** — the crest, the wordmark and the founding date, then the shutters
  open onto the pitch. It plays once per browsing session and can be skipped at any time.
- **Hero** — a floodlit pitch at dusk rendered with WebGL: goal and net, terraces with a
  crowd that breathes, corner flags, drifting dust and a real truncated-icosahedron
  football. The camera cranes in from ground level, then follows the pointer.
  Tap the pitch to juggle the ball; drag to look around. All sound is synthesised in the
  browser — nothing is downloaded — and it stays off until you interact.
- **Chapters** — the club, its values, programmes, coaches, the game, and how to visit,
  each announced with a chapter slate and revealed on scroll.
- **Film layer** — grain, vignette, light leak and letterbox bars over the whole page.

## Editing the shop

Open **`assets/shop/shop.json`** on GitHub, edit, commit. The shop rebuilds on the
next deploy — no code to touch.

Each item takes a `name`, a `team` (`rangers`, `newmabu`, `gila` or `all`), an
optional `note`, optional `sizes`, and a `price`. Leave `price` as `null` and the
card shows *Ask for price*; put a number there and it shows the peso amount. Add
`"sold_out": true` to grey one out, or `"image": "assets/shop/thing.webp"` once
there are product photos.

Nothing is charged on the site. Orders arrive as a text or email to a coach.

## Adding photos and videos to the gallery

Drop the files into **`assets/gallery/`** and that is the whole job — the site
picks them up on the next deploy. Nothing here needs editing.

From a phone or a laptop, without installing anything:

1. Open [`assets/gallery/`](../../tree/main/assets/gallery) on GitHub.
2. **Add file → Upload files**, then drag the photos or clips in.
3. **Commit changes.**

A minute or so later they are live in the *From the Pitch* section, which plays
them as a slideshow. Remove a file the same way and it disappears.

**Name the file and you get a caption for free.** The deploy reads the filename,
so `2026-06-14-grand-finals-in-koronadal.jpg` shows up as *Grand finals in
Koronadal*, dated 14 June 2026. The leading date is optional; without one you
just get the caption.

A few practical limits:

- Photos: `.jpg`, `.png`, `.webp`, `.gif`, `.avif`. Videos: `.mp4`, `.webm`, `.mov`.
- **Use `.mp4` for video** — it is the one format every phone and browser plays.
- GitHub refuses single files over 100MB, so trim long clips before uploading.
- Items appear in filename order, which is why dates in front are handy.

## Running it

No build step, no dependencies to install. Any static file server works:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` straight from the filesystem works too.

## Publishing

Every push to `main` publishes the site, via `.github/workflows/pages.yml`. The site is
plain static files, so there is nothing to build — the workflow uploads the repository
root to GitHub Pages. It can also be run by hand from the **Actions** tab.

`index.html` is the home page and the game lives at `/game/`.

The site answers on **rangersfc.net**. The `CNAME` file in the repository root holds that
domain — it has to stay in place, because the deploy uploads the repository as an artifact
and GitHub reads the custom domain from it. Deleting the file drops the domain.

## Degrading gracefully

The page is built so nothing is ever a hard requirement:

- No WebGL, or three.js fails to load → the hero falls back to the club crest.
- `prefers-reduced-motion` → the title sequence, grain, parallax and the 3D scene are all
  skipped, and every reveal renders in its final state.
- No JavaScript → the full page still renders and reads, minus the stage.
- Phones get a wider lens, fewer particles and a lighter renderer.

## Contact

Coach James — [+63 993 291 0764](tel:+639932910764)
[Facebook](https://www.facebook.com/share/1F7K8LTuHT/) ·
[Google Maps](https://share.google/nRfj0M8NLTZqJQiBK)

---

© Rangers Football Club, Barangay Mabuhay, General Santos City.
Every child deserves a chance. Every dream matters. Every game is played with heart.
