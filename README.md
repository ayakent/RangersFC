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
| `gila/index.html` | Gila Academy — the skills academy. Grind. Improve. Learn. Achieve. |
| `shop/index.html` | Club shop for all three teams. |
| `assets/shop/shop.json` | The shop's stock. Edit this to change items, prices and sizes. |
| `assets/team.css`, `assets/team.js` | Shared kit behind the three pages above. |
| `assets/stage.js` | The 3D hero stages and title sequences for the two sister-team pages. |
| `assets/` | Club crest, favicon, the game still, the share card, the squad photo and the founder's portrait. |
| `assets/gallery/` | Whatever you upload. Sub-folders feed the sister-team pages. |
| `tools/build-gallery.py` | Turns those folders into gallery manifests. Run it after adding photos. |
| `assets/gallery.js` | The slideshow, shared by every page that has one. |
| `vendor/three.min.js` | three.js r128, used by the hero scene (MIT — see `vendor/three.LICENSE`). |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are, without running Jekyll. |

## The page

A single scroll, staged like a short film.

- **Title sequence** — the crest, the wordmark and the founding date, then the shutters
  open onto the pitch. It plays once per browsing session and can be skipped at any time.
- **Hero** — a floodlit pitch at dusk rendered with WebGL: goal and net, terraces with a
  crowd that breathes, corner flags, drifting dust and a real truncated-icosahedron
  football. The camera cranes in from ground level, then follows the pointer.
  Tap the pitch to juggle the ball; drag to look around. All sound is synthesised in the
  browser — nothing is downloaded — and it stays off until you interact.
- **Chapters** — the club, its founder, its values, programmes, coaches, the game, and how
  to visit, each announced with a chapter slate and revealed on scroll.
- **The Founder** — chapter 02 honours Roberto P. Barrientos, who started the club on
  14 June 1996.
- **Film layer** — grain, vignette, light leak and letterbox bars over the whole page.

## The sister-team pages

FC New Mabu and Gila each open on a title sequence and then a hero that is a real
scene, not a picture — WebGL, lit properly, with physics you can knock about and
sound synthesised in the browser. One engine, `assets/stage.js`, two scenes chosen
by `data-stage` on the hero's `#stage` element.

- **FC New Mabu** — the schoolyard court at dusk in the club's pink: the school block with its
  covered walkway, mango trees, a low sun. Tap and another ball drops onto the
  court, bounces, rolls and knocks into the others. One tap, one more child
  reached — which is the whole point of the club. The counter keeps score.
- **Gila Academy** — a rebound wall under one floodlight at night, cones set out, dust in
  the beam. Tap and the ball is struck at the board and comes back. Reps count up;
  let the ball come to rest and the chain breaks and you start again. That is the
  grind, made literal.

FC New Mabu also plays the club's anthem, `assets/mabu-music.mp3`. It starts from the
top of the track the moment the title sequence clears, and the sound switch in the bar
governs both it and the scene.

Browsers refuse to start audio until the visitor has touched the page, so a blocked
attempt waits for the first tap, key press or press of the switch — and still starts at
the top of the track when it fires. While it is waiting, **the switch reads off**, because
a silent page must not claim its sound is on, and pressing it then asks for the sound
rather than turning off the silence. Switching sound off is remembered across the whole
site, so a visitor who muted the home page arrives here muted, with the switch showing it.

Both fall back the same way the home page does: no WebGL, no three.js, or
`prefers-reduced-motion` and the hero is simply a still page that reads fine.

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

Every page has its own folder. Drop files in the right one, then rebuild the
manifests so the site knows about them (see **Publishing** — one command).

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

Then run `python3 tools/build-gallery.py` and commit the `gallery.json` files it
writes — or just tell me you have uploaded some and I will. A minute or so later
they are live, played as a slideshow. Remove a file the same way and it disappears.
A page whose folder is empty simply hides its gallery, so there is never a
broken-looking empty section.

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

The site publishes straight from the `main` branch: **Settings → Pages → Source →
Deploy from a branch → `main` → `/ (root)`**. Push to `main` and it is live a minute
later. There is nothing to build — it is plain static files, and `.nojekyll` in the root
tells GitHub to serve them exactly as they are rather than running them through Jekyll.

`index.html` is the home page and the game lives at `/game/`.

**One thing to remember on this route:** the gallery manifests are not rebuilt for you.
After adding or removing photos, run `python3 tools/build-gallery.py` and commit the
`gallery.json` files it writes. (Under the Actions route below, that happened on every
deploy.)

`.github/workflows/pages.yml` is the other route — Pages' GitHub Actions publishing — and
it still works, gallery manifests and all. It is set to manual dispatch only, because its
`configure-pages` step would otherwise flip the Source back to GitHub Actions on the next
push. It was taken off automatic on 6 August 2026, when GitHub's Pages publishing queue
stalled for hours: five runs in a row uploaded the artifact in two seconds and then sat at
`deployment_queued` until the action hit its ten-minute ceiling, which cannot be raised.
To go back to it, run the workflow by hand **and** set the Source to GitHub Actions.

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
