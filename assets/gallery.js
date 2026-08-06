/* ==========================================================================
   Gallery slideshow, shared by every page that has one.

   Mark up a section like this and the rest is automatic:

     <section data-gallery data-manifest="assets/gallery/gila/gallery.json" hidden>
       <div class="gal-stage"> … prev/next buttons … </div>
       <div class="gal-dots"></div>
       <p class="gal-count"></p>
     </section>

   The manifest is written at deploy time from whatever is in the folder, so
   adding a photo or a clip to a page means dropping a file in — nothing here
   needs editing. A section whose folder is empty stays hidden.
   ========================================================================== */
(function(){
"use strict";
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

[].slice.call(document.querySelectorAll('[data-gallery]')).forEach(function(sec){
  var manifest = sec.getAttribute('data-manifest');
  if(!manifest || !window.fetch) return;

  var stage = sec.querySelector('.gal-stage'),
      dotsEl = sec.querySelector('.gal-dots'),
      countEl = sec.querySelector('.gal-count');
  if(!stage) return;

  var items = [], slides = [], at = 0, timer = null, gen = 0, HOLD = 5000;

  fetch(manifest, {cache:'no-cache'})
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(data){
      items = (data && data.items) || [];
      if(!items.length) return;            /* nothing uploaded for this page yet */
      sec.hidden = false;
      build();
      show(0);
    })['catch'](function(){ /* no manifest — leave the section hidden */ });

  /* manifest paths are relative to the site root; pages in a sub-folder need
     to climb back out */
  var base = sec.getAttribute('data-base') || '';

  function build(){
    items.forEach(function(item, i){
      var slide = document.createElement('div');
      slide.className = 'gal-item';
      var media;
      if(item.type === 'video'){
        media = document.createElement('video');
        media.src = base + item.src;
        media.muted = true;                /* muted, or phones refuse to play it */
        media.playsInline = true;
        media.setAttribute('playsinline', '');
        media.preload = i === 0 ? 'metadata' : 'none';
        /* a file the browser cannot decode fires "ended" straight away, which
           would race through everything — only honour it from the slide on
           screen, and only when something really played */
        media.addEventListener('ended', function(){
          if(slides[at] !== slide) return;
          if(!isFinite(media.duration) || media.duration <= 0){ queue(HOLD); return; }
          next();
        });
        media.addEventListener('error', function(){ if(slides[at] === slide) queue(HOLD); });
      }else{
        media = document.createElement('img');
        media.src = base + item.src;
        media.loading = i === 0 ? 'eager' : 'lazy';
        media.decoding = 'async';
      }
      media.alt = item.caption || '';
      slide.appendChild(media);

      if(item.caption || item.date){
        var cap = document.createElement('div');
        cap.className = 'gal-cap';
        if(item.caption){ var b = document.createElement('b'); b.textContent = item.caption; cap.appendChild(b); }
        if(item.date){ var sp = document.createElement('span'); sp.textContent = item.date; cap.appendChild(sp); }
        slide.appendChild(cap);
      }
      stage.appendChild(slide);
      slides.push(slide);

      if(dotsEl){
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Show item ' + (i + 1));
        dot.addEventListener('click', function(){ show(i); });
        dotsEl.appendChild(dot);
      }
    });

    var prev = stage.querySelector('.gal-nav.prev'), nx = stage.querySelector('.gal-nav.next');
    if(prev) prev.addEventListener('click', function(){ show(at - 1); });
    if(nx) nx.addEventListener('click', next);
    /* leave it alone while someone is looking closely */
    stage.addEventListener('pointerenter', stop);
    stage.addEventListener('pointerleave', function(){ queue(); });
    stage.addEventListener('focusin', stop);
  }

  function next(){ show(at + 1); }
  function stop(){ clearTimeout(timer); }
  function queue(ms){
    stop();
    if(reduced || items.length < 2) return;
    var mine = gen;
    timer = setTimeout(function(){
      /* clearTimeout cannot recall a callback already on its way, so a tap
         landing on the same tick would skip a slide */
      if(mine === gen) next();
    }, ms || (items[at].type === 'video' ? 20000 : HOLD));
  }

  function show(i){
    if(!slides.length) return;
    i = (i + slides.length) % slides.length;
    slides.forEach(function(s, n){
      s.classList.toggle('on', n === i);
      var v = s.querySelector('video');
      if(v && n !== i) v.pause();
      if(dotsEl && dotsEl.children[n]) dotsEl.children[n].classList.toggle('on', n === i);
    });
    at = i;
    gen++;
    if(countEl) countEl.textContent = (i + 1) + ' / ' + slides.length;
    var vid = slides[i].querySelector('video');
    if(vid){
      vid.currentTime = 0;
      var pr = vid.play();
      if(pr && pr['catch']) pr['catch'](function(){ queue(HOLD); });
    }
    queue();
  }
});
})();
