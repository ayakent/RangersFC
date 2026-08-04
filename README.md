# Rangers Football Club

The website for Rangers Football Club — a grassroots football club in Yam 1, Purok 27,
Barangay Mabuhay, General Santos City, founded 14 June 1996.

**Play with your heart.**

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | The club website. One self-contained page: markup, styles and scripts. |
| `game/index.html` | *SKY: Soccer Quest*, the club's side-scrolling football game. |
| `assets/` | Club crest, favicon, and the game still used on the site. |
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

## Running it

No build step, no dependencies to install. Any static file server works:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` straight from the filesystem works too.

## Publishing

The site is plain static files, so GitHub Pages serves it as-is: in
**Settings → Pages**, set the source to the branch you want and the root (`/`) folder.
`index.html` becomes the home page and the game lives at `/game/`.

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
