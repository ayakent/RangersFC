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
| `assets/stage.js` | The 3D hero stages and title sequences for the two sister-team pages. |
| `assets/` | Club crest, favicon, the game still, the share card and the squad photo. |
| `assets/gallery/` | Whatever you upload. Sub-folders feed the sister-team pages. |
| `tools/build-gallery.py` | Turns those folders into gallery manifests at deploy time. |
| `assets/gallery.js` | The slideshow, shared by every page that has one. |
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

## The sister-team pages

FC New Mabu and Gila each open on a title sequence and then a hero that is a real
scene, not a picture — WebGL, lit properly, with physics you can knock about and
sound synthesised in the browser. One engine, `assets/stage.js`, two scenes chosen
by `data-stage` on the hero's `#stage` element.

- **FC New Mabu** — the schoolyard court at golden hour: the school block with its
  covered walkway, mango trees, a low sun. Tap and another ball drops onto the
  court, bounces, rolls and knocks into the others. One tap, one more child
  reached — which is the whole point of the club. The counter keeps score.
- **Gila** — a rebound wall under one floodlight at night, cones set out, dust in
  the beam. Tap and the ball is struck at the board and comes back. Reps count up;
  let the ball come to rest and the chain breaks and you start again. That is the
  grind, made literal.

Both fall back the same way the home page does: no WebGL, no three.js, or
`prefers-reduced-motion` and the hero is simply a still page that reads fine.
Sound stays off until you press **Sound On**.

## Editing the shop

Open **`assets/shop/shop.json`** on GitHub, edit, commit. The shop rebuilds on the
next deploy — no code to touch.

Each item takes a `name`, a `team` (`rangers`, `newmabu`, `gila` or `all`), an
optional `note`, optional `sizes`, and a `price`. Leave `price` as `null` and the
card shows *Ask for price*; put a number there and it shows the peso amount. Add
`"sold_out": true` to grey one out, or `"image": "assets/shop/thing.webp"` once
there are product photos.

Nothing is charged on the site. Orders arrive as a text or email to a coach.

## Adding photos and videos

Every page has its own folder. Drop files in the right one and that is the whole
job — the site picks them up on the next deploy. Nothing here needs editing.

| Put the file here | It appears on |
| --- | --- |
| [`assets/gallery/`](../../tree/main/assets/gallery) | the Rangers home page |
| [`assets/gallery/new-mabu/`](../../tree/main/assets/gallery/new-mabu) | the FC New Mabu page |
| [`assets/gallery/gila/`](../../tree/main/assets/gallery/gila) | the Gila page |
| [`assets/shop/`](../../tree/main/assets/shop) | product photos for the shop — see below |

From a phone or a laptop, without installing anything:

1. Open the folder on GitHub.
2. **Add file → Upload files**, then drag the photos or clips in.
3. **Commit changes.**

A minute or so later they are live, played as a slideshow. Remove a file the same
way and it disappears. A page whose folder is empty simply hides its gallery, so
there is never a broken-looking empty section.

**Shop photos work slightly differently.** Upload the picture to `assets/shop/`,
then point an item at it in `assets/shop/shop.json`:

```json
{ "name": "Rangers FC Home Jersey", "image": "assets/shop/home-jersey.webp" }
```

Without an `image` the card falls back to the club crest, which is why the shop
looks finished before any product photography exists.

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
