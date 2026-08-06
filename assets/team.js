/* ==========================================================================
   Shared behaviour for the sister-team and shop pages: scroll reveals,
   word-by-word headlines, the scroll reel, parallax and the hiding nav.
   Everything degrades to "already visible" when motion is reduced.
   ========================================================================== */
(function(){
"use strict";
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var doc = document.documentElement;

/* ---------- headline words, wrapped so they can rise out of a mask ---------- */
[].slice.call(document.querySelectorAll('.rt')).forEach(function(el){
  [].slice.call(el.childNodes).forEach(function(node){
    if(node.nodeType === 3){
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function(part){
        if(!part) return;
        if(/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span'); w.className = 'w';
        var i = document.createElement('i'); i.textContent = part;
        w.appendChild(i); frag.appendChild(w);
      });
      el.replaceChild(frag, node);
    }else if(node.nodeType === 1 && !node.classList.contains('w')){
      var inner = node.textContent;
      node.textContent = '';
      inner.split(/(\s+)/).forEach(function(part){
        if(!part) return;
        if(/^\s+$/.test(part)){ node.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span'); w.className = 'w';
        var i = document.createElement('i'); i.textContent = part;
        w.appendChild(i); node.appendChild(w);
      });
    }
  });
  [].slice.call(el.querySelectorAll('.w i')).forEach(function(i, n){
    i.style.transitionDelay = Math.min(n * 0.045, 0.7) + 's';
  });
});

/* ---------- reveals ---------- */
var revealEls = document.querySelectorAll('.reveal, .rt, .rulewrap');
if('IntersectionObserver' in window && !reduced){
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, {threshold:.12, rootMargin:'0px 0px -8% 0px'});
  [].slice.call(revealEls).forEach(function(el){ io.observe(el); });
}else{
  [].slice.call(revealEls).forEach(function(el){ el.classList.add('in'); });
}

/* ---------- counters ---------- */
function countUp(el){
  var target = parseInt(el.getAttribute('data-target'), 10);
  var dur = 1500, start = null;
  function step(t){
    if(start === null) start = t;
    var p = Math.min((t - start) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if(p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
var counts = document.querySelectorAll('.count');
if('IntersectionObserver' in window && !reduced){
  var cio = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ countUp(e.target); cio.unobserve(e.target); } });
  }, {threshold:.4});
  [].slice.call(counts).forEach(function(el){ cio.observe(el); });
}else{
  [].slice.call(counts).forEach(function(el){ el.textContent = el.getAttribute('data-target'); });
}

/* ---------- nav + reel + parallax ---------- */
var nav = document.querySelector('.nav');
var reelFill = document.querySelector('#reel i');
var parEls = [].slice.call(document.querySelectorAll('.par'));
var lastY = 0, ticking = false;

function onScroll(){
  var y = window.scrollY || window.pageYOffset;
  if(nav){
    nav.classList.toggle('scrolled', y > 10);
    nav.classList.toggle('hide', y > 460 && y > lastY + 4);
  }
  if(reelFill){
    var max = doc.scrollHeight - window.innerHeight;
    reelFill.style.height = (max > 0 ? (y / max) * 100 : 0) + '%';
  }
  lastY = y;
  if(!reduced){
    for(var i = 0; i < parEls.length; i++){
      var el = parEls[i], r = el.getBoundingClientRect();
      if(r.bottom < -200 || r.top > window.innerHeight + 200) continue;
      var sp = parseFloat(el.getAttribute('data-speed')) || -0.08;
      var mid = r.top + r.height / 2 - window.innerHeight / 2;
      el.style.transform = 'translate3d(0,' + (mid * sp).toFixed(1) + 'px,0)';
    }
  }
}
window.addEventListener('scroll', function(){
  if(ticking) return;
  ticking = true;
  requestAnimationFrame(function(){ onScroll(); ticking = false; });
}, {passive:true});
onScroll();

/* ---------- hover flourishes ---------- */
if(window.matchMedia('(hover: hover)').matches && !reduced){
  [].slice.call(document.querySelectorAll('[data-tilt]')).forEach(function(card){
    card.addEventListener('pointermove', function(e){
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      card.style.transform = 'perspective(720px) rotateX(' + (-py*6).toFixed(2) + 'deg) rotateY(' +
                             (px*7).toFixed(2) + 'deg) translateY(-4px)';
    });
    card.addEventListener('pointerleave', function(){ card.style.transform = ''; });
  });
  [].slice.call(document.querySelectorAll('[data-magnet]')).forEach(function(btn){
    btn.addEventListener('pointermove', function(e){
      var r = btn.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width/2)) / r.width;
      var dy = (e.clientY - (r.top + r.height/2)) / r.height;
      btn.style.transform = 'translate(' + (dx*9).toFixed(1) + 'px,' + (dy*7 - 3).toFixed(1) + 'px)';
    });
    btn.addEventListener('pointerleave', function(){ btn.style.transform = ''; });
  });
}

/* the hero animates in on load rather than on scroll — it is already in view */
var hero = document.querySelector('.hero');
if(hero) requestAnimationFrame(function(){ hero.classList.add('live'); });
})();
