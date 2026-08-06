/* ==========================================================================
   Real-time 3D hero stages for the sister-team pages.

   One engine, two scenes, chosen by data-stage on #stage:

     data-stage="mabu"  a schoolyard futsal court at dusk. Every tap
                        drops another ball onto the court; they bounce, roll
                        and knock into each other. One tap, one more child.

     data-stage="gila"  a rebound wall under a single floodlight at night.
                        Every tap strikes the ball at the board and it comes
                        back. Reps count up. That is the whole idea of Gila.

   Physics is written here rather than pulled in: spheres against a plane and
   against each other is a hundred lines, and a physics library is a megabyte.

   All sound is synthesised — nothing is downloaded — and it stays silent
   until the visitor interacts, because browsers require that anyway.
   ========================================================================== */
(function(){
"use strict";

var reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var hoverCap = window.matchMedia('(hover: hover)').matches;
var isSmall  = window.matchMedia('(max-width: 820px)').matches;

var host  = document.getElementById('stage');
var mode  = host ? host.getAttribute('data-stage') : null;
var hero  = document.querySelector('.hero');
var hintEl = document.getElementById('hint');
var popEl  = document.getElementById('pop');
var aEl    = document.getElementById('statA');
var bEl    = document.getElementById('statB');
var sndBtn = document.getElementById('sndBtn');

/* ==========================================================================
   TITLE SEQUENCE
   ========================================================================== */
var introEl = document.getElementById('intro');
var introDone = false, onIntroEnd = [];

function endIntro(fast){
  if(introDone) return;
  introDone = true;
  if(introEl){
    introEl.classList.add('out');
    setTimeout(function(){ introEl.classList.add('gone'); }, 1200);
    setTimeout(function(){ if(introEl.parentNode) introEl.parentNode.removeChild(introEl); }, 1900);
  }
  document.body.classList.remove('locked');
  if(hero) hero.classList.add('live');
  onIntroEnd.forEach(function(fn){ try{ fn(); }catch(e){} });
}

(function(){
  var seen = false;
  try{ seen = sessionStorage.getItem('rfc_intro_' + (mode || 'x')) === '1'; }catch(e){}
  if(!introEl || reduced || seen){
    if(introEl && introEl.parentNode) introEl.parentNode.removeChild(introEl);
    document.body.classList.remove('locked');
    if(hero) hero.classList.add('live');
    introDone = true;
    return;
  }
  try{ sessionStorage.setItem('rfc_intro_' + (mode || 'x'), '1'); }catch(e){}
  document.body.classList.add('locked');
  setTimeout(function(){ endIntro(false); }, 4200);
  var skip = document.getElementById('skipIntro');
  if(skip) skip.addEventListener('click', function(){ endIntro(true); });
  window.addEventListener('keydown', function(e){
    if(!introDone && (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')) endIntro(true);
  });
  window.addEventListener('wheel', function(){ endIntro(true); }, {passive:true, once:true});
  window.addEventListener('touchstart', function(){ endIntro(true); }, {passive:true, once:true});
})();

/* ==========================================================================
   SOUND — synthesised, and only after the visitor has touched something
   ========================================================================== */
var AC = null, master = null, muted = false;

function ensureAudio(){
  if(muted || AC) { if(AC && AC.state === 'suspended') AC.resume(); return; }
  try{
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain();
    master.gain.value = 1;
    master.connect(AC.destination);
    bed();
  }catch(e){ AC = null; }
}

/* a low filtered-noise ambience: distant afternoon for the school, a night
   hum for the training ground */
function bed(){
  var len = AC.sampleRate * 3;
  var buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0), last = 0;
  for(var i = 0; i < len; i++){
    var w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last * 3.2;
  }
  var src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
  var f = AC.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = mode === 'gila' ? 320 : 560;
  var g = AC.createGain();
  g.gain.setValueAtTime(0, AC.currentTime);
  g.gain.linearRampToValueAtTime(mode === 'gila' ? 0.035 : 0.05, AC.currentTime + 2.5);
  var lfo = AC.createOscillator(); lfo.frequency.value = 0.06;
  var lg = AC.createGain(); lg.gain.value = 0.015;
  lfo.connect(lg); lg.connect(g.gain); lfo.start();
  src.connect(f); f.connect(g); g.connect(master); src.start();
}

function thump(freq, vol, dur, bright){
  if(!AC || muted) return;
  var t = AC.currentTime;
  var o = AC.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.4), t + dur);
  var g = AC.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.02);

  var nlen = Math.floor(AC.sampleRate * 0.035);
  var nb = AC.createBuffer(1, nlen, AC.sampleRate), nd = nb.getChannelData(0);
  for(var i = 0; i < nlen; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nlen);
  var ns = AC.createBufferSource(); ns.buffer = nb;
  var nf = AC.createBiquadFilter();
  nf.type = 'bandpass'; nf.frequency.value = bright || 1700;
  var ng = AC.createGain(); ng.gain.value = vol * 0.55;
  ns.connect(nf); nf.connect(ng); ng.connect(master);
  ns.start(t);
}
function sBounce(v){ thump(96, Math.min(0.3, 0.05 + v * 0.03), 0.13, 1500); }
function sKick(){ thump(132, 0.42, 0.15, 1900); }
function sWall(v){ thump(178, Math.min(0.38, 0.12 + v * 0.02), 0.10, 2900); }
function sSpawn(){ thump(300, 0.14, 0.08, 2400); }
function peep(t0, dur){
  var o1 = AC.createOscillator(); o1.type = 'triangle'; o1.frequency.value = 3600;
  var o2 = AC.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 3730;
  var bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3650; bp.Q.value = 3;
  var g = AC.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.09, t0 + 0.02);
  g.gain.setValueAtTime(0.09, t0 + dur - 0.04);
  g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
  o1.connect(bp); o2.connect(bp); bp.connect(g); g.connect(master);
  o1.start(t0); o2.start(t0); o1.stop(t0 + dur); o2.stop(t0 + dur);
}
function sWhistle(){ if(!AC || muted) return; var t = AC.currentTime; peep(t, 0.18); peep(t + 0.28, 0.3); }

if(sndBtn){
  sndBtn.addEventListener('click', function(){
    muted = !muted;
    sndBtn.textContent = muted ? 'Sound Off' : 'Sound On';
    sndBtn.setAttribute('aria-pressed', String(!muted));
    if(!muted) ensureAudio();
    if(AC && master) master.gain.setTargetAtTime(muted ? 0 : 1, AC.currentTime, 0.05);
  });
}

/* ---------- little UI helpers ---------- */
var hintDefault = hintEl ? hintEl.textContent : '', hintTimer = null;
function setHint(msg){
  hintDefault = msg;
  if(hintEl && !hintTimer) hintEl.textContent = msg;
}
function flashHint(msg){
  if(!hintEl) return;
  hintEl.textContent = msg;
  clearTimeout(hintTimer);
  hintTimer = setTimeout(function(){ hintTimer = null; hintEl.textContent = hintDefault; }, 1600);
}
function popMsg(msg){
  if(!popEl) return;
  popEl.textContent = msg;
  popEl.classList.remove('show');
  void popEl.offsetWidth;
  popEl.classList.add('show');
}

/* ==========================================================================
   STAGE
   ========================================================================== */
if(!host || !mode || reduced || !window.WebGLRenderingContext || typeof THREE === 'undefined'){
  if(hero) hero.classList.remove('has-stage');
}else{
try{
  var renderer = new THREE.WebGLRenderer({antialias: !isSmall, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 1.9));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = mode === 'gila' ? 1.08 : 1.12;
  host.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 260);

  /* ---------- a real football, built rather than textured ---------- */
  function buildBall(R){
    var t = (1 + Math.sqrt(5)) / 2;
    var V = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];
    var F = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
             [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
    var verts = [], tp = {};
    function mid(a, b){
      var k = a + '>' + b;
      if(tp[k] !== undefined) return tp[k];
      var A = V[a], B = V[b];
      verts.push(new THREE.Vector3(A[0] + (B[0]-A[0])/3, A[1] + (B[1]-A[1])/3, A[2] + (B[2]-A[2])/3));
      tp[k] = verts.length - 1;
      return tp[k];
    }
    var nb = [];
    for(var i = 0; i < 12; i++) nb.push({});
    F.forEach(function(f){
      nb[f[0]][f[1]] = 1; nb[f[0]][f[2]] = 1; nb[f[1]][f[0]] = 1;
      nb[f[1]][f[2]] = 1; nb[f[2]][f[0]] = 1; nb[f[2]][f[1]] = 1;
    });
    var pent = [], hex = [];
    for(var v = 0; v < 12; v++){
      var list = Object.keys(nb[v]).map(Number);
      var P = new THREE.Vector3(V[v][0], V[v][1], V[v][2]);
      var Pn = P.clone().normalize();
      var e0 = new THREE.Vector3(V[list[0]][0], V[list[0]][1], V[list[0]][2]).sub(P);
      e0.addScaledVector(Pn, -e0.dot(Pn)).normalize();
      var e1 = new THREE.Vector3().crossVectors(Pn, e0);
      list.sort(function(a, b){
        var da = new THREE.Vector3(V[a][0], V[a][1], V[a][2]).sub(P);
        var db = new THREE.Vector3(V[b][0], V[b][1], V[b][2]).sub(P);
        return Math.atan2(da.dot(e1), da.dot(e0)) - Math.atan2(db.dot(e1), db.dot(e0));
      });
      pent.push(list.map(function(n){ return mid(v, n); }));
    }
    F.forEach(function(f){
      hex.push([mid(f[0],f[1]), mid(f[1],f[0]), mid(f[1],f[2]), mid(f[2],f[1]), mid(f[2],f[0]), mid(f[0],f[2])]);
    });
    var pv = verts.map(function(p){ return p.clone().normalize().multiplyScalar(R); });
    function geom(polys){
      var pos = [], nrm = [];
      polys.forEach(function(poly){
        var c = new THREE.Vector3();
        poly.forEach(function(i){ c.add(pv[i]); });
        c.multiplyScalar(1 / poly.length).normalize().multiplyScalar(R);
        for(var i = 0; i < poly.length; i++){
          var p1 = pv[poly[i]], p2 = pv[poly[(i + 1) % poly.length]];
          [c, p1, p2].forEach(function(p){
            pos.push(p.x, p.y, p.z);
            var n = p.clone().normalize();
            nrm.push(n.x, n.y, n.z);
          });
        }
      });
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
      return g;
    }
    var grp = new THREE.Group();
    var white = new THREE.MeshPhysicalMaterial({color:0xf6f3ec, roughness:0.34, metalness:0,
      clearcoat:0.6, clearcoatRoughness:0.35, side:THREE.DoubleSide});
    var dark = new THREE.MeshPhysicalMaterial({color:0x14171c, roughness:0.3, metalness:0,
      clearcoat:0.7, clearcoatRoughness:0.3, side:THREE.DoubleSide});
    var mh = new THREE.Mesh(geom(hex), white), mp = new THREE.Mesh(geom(pent), dark);
    mh.castShadow = mp.castShadow = true;
    grp.add(mh); grp.add(mp);
    return grp;
  }

  /* soft contact shadow that follows a ball */
  var blobTex = (function(){
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(64, 64, 5, 64, 64, 62);
    g.addColorStop(0, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  function blob(r){
    var m = new THREE.Mesh(new THREE.CircleGeometry(r, 20),
      new THREE.MeshBasicMaterial({map:blobTex, transparent:true, opacity:.5, depthWrite:false}));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.015;
    scene.add(m);
    return m;
  }
  function glowSprite(scale, color, alpha){
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(64, 64, 3, 64, 64, 62);
    g.addColorStop(0, 'rgba(255,255,255,.95)');
    g.addColorStop(.35, 'rgba(255,235,205,.4)');
    g.addColorStop(1, 'rgba(255,235,205,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    var s = new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c), color:color,
      blending:THREE.AdditiveBlending, transparent:true, depthWrite:false, fog:false,
      opacity:alpha === undefined ? 1 : alpha}));
    s.scale.set(scale, scale, 1);
    return s;
  }
  function skyDome(stops, radius){
    var c = document.createElement('canvas'); c.width = 32; c.height = 256;
    var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 0, 256);
    stops.forEach(function(s){ g.addColorStop(s[0], s[1]); });
    x.fillStyle = g; x.fillRect(0, 0, 32, 256);
    var m = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16),
      new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c), side:THREE.BackSide, fog:false}));
    scene.add(m);
    return m;
  }

  /* ---------- shared physics for a bouncing ball ---------- */
  var GRAV = 22;
  function Ball(R, x, y, z){
    this.R = R;
    this.p = new THREE.Vector3(x, y, z);
    this.v = new THREE.Vector3();
    this.axis = new THREE.Vector3(1, 0, 0);
    this.spin = 0;
    this.mesh = buildBall(R);
    this.mesh.position.copy(this.p);
    scene.add(this.mesh);
    this.shadow = blob(R * 1.25);
    this.squash = 1;
    this.rest = 0;
  }
  Ball.prototype.step = function(dt, bounds, onFloor){
    this.v.y -= GRAV * dt;
    this.p.addScaledVector(this.v, dt);

    if(bounds){
      if(this.p.x >  bounds.x){ this.p.x =  bounds.x; this.v.x *= -0.55; }
      if(this.p.x < -bounds.x){ this.p.x = -bounds.x; this.v.x *= -0.55; }
      if(this.p.z >  bounds.z2){ this.p.z =  bounds.z2; this.v.z *= -0.55; }
      if(this.p.z <  bounds.z1){ this.p.z =  bounds.z1; this.v.z *= -0.55; }
    }
    if(this.p.y <= this.R){
      var impact = -this.v.y;
      this.p.y = this.R;
      if(impact > 1.1){
        this.v.y = impact * 0.52;
        this.v.x *= 0.84; this.v.z *= 0.84;
        this.spin *= 0.7;
        this.squash = 0.8;
        if(onFloor) onFloor(impact);
        this.rest = 0;
      }else{
        this.v.y = 0;
        var fr = Math.pow(0.22, dt);
        this.v.x *= fr; this.v.z *= fr;
        if(this.v.lengthSq() < 0.004){ this.v.set(0, 0, 0); this.rest += dt; }
      }
    }
    /* rolling when grounded, free spin when airborne */
    if(this.p.y > this.R + 0.02){
      if(this.spin > 0.01){
        this.mesh.rotateOnWorldAxis(this.axis, this.spin * dt);
        this.spin *= Math.pow(0.6, dt);
      }
    }else{
      var hs = Math.sqrt(this.v.x * this.v.x + this.v.z * this.v.z);
      if(hs > 0.02){
        this.mesh.rotateOnWorldAxis(
          new THREE.Vector3(this.v.z, 0, -this.v.x).normalize(), hs * dt / this.R);
      }
    }
    this.squash += (1 - this.squash) * Math.min(1, dt * 9);
    this.mesh.position.copy(this.p);
    this.mesh.scale.set(1 + (1 - this.squash) * .45, this.squash, 1 + (1 - this.squash) * .45);
    var h = this.p.y - this.R;
    var s = THREE.MathUtils.clamp(1.2 - h * 0.1, 0.35, 1.2);
    this.shadow.position.set(this.p.x, 0.015, this.p.z);
    this.shadow.scale.set(s, s, 1);
    this.shadow.material.opacity = 0.5 * s;
  };
  Ball.prototype.remove = function(){
    scene.remove(this.mesh); scene.remove(this.shadow);
  };

  /* equal-mass sphere collision, positionally corrected so they never sink */
  function collide(list){
    for(var i = 0; i < list.length; i++){
      for(var j = i + 1; j < list.length; j++){
        var a = list[i], b = list[j];
        var dx = b.p.x - a.p.x, dy = b.p.y - a.p.y, dz = b.p.z - a.p.z;
        var d2 = dx*dx + dy*dy + dz*dz, min = a.R + b.R;
        if(d2 <= 0.0001 || d2 >= min * min) continue;
        var d = Math.sqrt(d2);
        var nx = dx / d, ny = dy / d, nz = dz / d;
        var push = (min - d) * 0.5;
        a.p.x -= nx * push; a.p.y -= ny * push; a.p.z -= nz * push;
        b.p.x += nx * push; b.p.y += ny * push; b.p.z += nz * push;
        var rv = (b.v.x - a.v.x) * nx + (b.v.y - a.v.y) * ny + (b.v.z - a.v.z) * nz;
        if(rv > 0) continue;
        var imp = -(1 + 0.55) * rv / 2;
        a.v.x -= imp * nx; a.v.y -= imp * ny; a.v.z -= imp * nz;
        b.v.x += imp * nx; b.v.y += imp * ny; b.v.z += imp * nz;
        a.rest = b.rest = 0;
      }
    }
  }

  /* ---------- camera rig ---------- */
  var target = new THREE.Vector3(0, 1.2, 0);
  var yaw = 0, pitchA = 0.2, radius = 12;
  var yawT = 0, pitchT = 0.2, radiusT = 12;
  var craneT = 0, craning = false, shake = 0, camFit = 1, scrollLift = 0;
  var home = {yaw:0, pitch:0.2, radius:12, from:{yaw:-0.7, pitch:0.03, radius:4.6}};

  function startCrane(){ if(!craning){ craning = true; craneT = 0; } }
  onIntroEnd.push(startCrane);
  if(introDone) startCrane();

  function easeIO(x){ return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2; }

  function updCam(t, dt){
    if(craning){
      craneT = Math.min(1, craneT + dt / 2.8);
      var e = easeIO(craneT);
      yawT    = home.from.yaw    + (home.yaw    - home.from.yaw)    * e;
      pitchT  = home.from.pitch  + (home.pitch  - home.from.pitch)  * e;
      radiusT = home.from.radius + (home.radius - home.from.radius) * e;
      if(craneT >= 1) craning = false;
    }
    var k = Math.min(1, dt * (craning ? 14 : 5));
    yaw += (yawT - yaw) * k;
    pitchA += (pitchT - pitchA) * k;
    radius += (radiusT - radius) * k;

    shake *= Math.pow(0.05, dt);
    var hx = Math.sin(t * 0.5) * 0.03 + Math.sin(t * 1.7) * 0.01;
    var hy = Math.cos(t * 0.4) * 0.025;
    var sh = shake * 0.08;
    var r = (radius + Math.sin(t * 0.35) * 0.06) * camFit + scrollLift * 6;
    var p = pitchA + scrollLift * 0.3;

    camera.position.set(
      target.x + r * Math.sin(yaw + hx) * Math.cos(p),
      target.y + r * Math.sin(p) + hy + (Math.random() - .5) * sh,
      target.z + r * Math.cos(yaw + hx) * Math.cos(p)
    );
    /* aim off-centre on wide screens so the copy on the left keeps its space */
    var off = camera.aspect > 1.1 ? 2.0 * Math.min(1, craneT) : 0;
    camera.lookAt(target.x - off + (Math.random() - .5) * sh,
                  target.y + hy * .5 + (Math.random() - .5) * sh, target.z);
  }

  /* ======================================================================
     SCENE — schoolyard court at dusk, in the club's pink
     ====================================================================== */
  var balls = [], bounds = null, tick = function(){}, onTap = function(){};

  if(mode === 'mabu'){
    scene.fog = new THREE.Fog(0x1b1218, 26, 96);
    skyDome([[0,'#120e16'],[.34,'#2c2534'],[.5,'#653450'],[.6,'#bd4569'],[.68,'#f2789f'],
             [.78,'#402b36'],[1,'#100a0e']], 100);

    /* the court: painted lines on hard standing */
    var cc = document.createElement('canvas'); cc.width = cc.height = 1024;
    var cx = cc.getContext('2d');
    cx.fillStyle = '#3b3e44'; cx.fillRect(0, 0, 1024, 1024);
    cx.fillStyle = '#35383e'; cx.fillRect(0, 0, 1024, 512);
    for(var s = 0; s < 5200; s++){
      cx.fillStyle = ['#27566f','#316a86','#2b6079'][(Math.random()*3)|0];
      cx.globalAlpha = .3;
      cx.fillRect(Math.random()*1024, Math.random()*1024, 3, 3);
    }
    cx.globalAlpha = 1;
    cx.strokeStyle = 'rgba(246,244,236,.9)'; cx.lineWidth = 6;
    cx.strokeRect(40, 40, 944, 944);
    cx.beginPath(); cx.moveTo(40, 512); cx.lineTo(984, 512); cx.stroke();
    cx.beginPath(); cx.arc(512, 512, 120, 0, 7); cx.stroke();
    cx.strokeRect(340, 40, 344, 150);
    cx.strokeRect(340, 834, 344, 150);
    var courtTex = new THREE.CanvasTexture(cc);
    courtTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    var court = new THREE.Mesh(new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({map:courtTex, roughness:.82, metalness:.02}));
    court.rotation.x = -Math.PI / 2;
    court.receiveShadow = true;
    scene.add(court);

    var apron = new THREE.Mesh(new THREE.CircleGeometry(80, 36),
      new THREE.MeshStandardMaterial({color:0x17161a, roughness:1}));
    apron.rotation.x = -Math.PI / 2; apron.position.y = -0.03;
    scene.add(apron);

    /* the school: a long low block with lit windows, and a covered walkway */
    var wall = new THREE.MeshStandardMaterial({color:0x62626a, roughness:.92});
    var roof = new THREE.MeshStandardMaterial({color:0x2e2e35, roughness:.85});
    var blockG = new THREE.Group();
    var body = new THREE.Mesh(new THREE.BoxGeometry(30, 4.6, 7), wall);
    body.position.set(0, 2.3, -18); body.castShadow = body.receiveShadow = true;
    blockG.add(body);
    var top = new THREE.Mesh(new THREE.BoxGeometry(31.5, .5, 8.4), roof);
    top.position.set(0, 4.8, -18); top.castShadow = true;
    blockG.add(top);
    var win = new THREE.MeshBasicMaterial({color:0xffd0bc, fog:false});
    for(var w = -6; w <= 6; w++){
      var pane = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), win);
      pane.position.set(w * 2.2, 2.5, -14.45);
      blockG.add(pane);
    }
    for(var pcol = -6; pcol <= 6; pcol += 2){
      var post = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, 3.2, 8), wall);
      post.position.set(pcol * 2.2, 1.6, -11.5); post.castShadow = true;
      blockG.add(post);
    }
    var canopy = new THREE.Mesh(new THREE.BoxGeometry(30, .3, 3.6), roof);
    canopy.position.set(0, 3.3, -12.6); canopy.castShadow = true;
    blockG.add(canopy);
    scene.add(blockG);

    /* mango trees, in silhouette */
    function tree(x, z, sc){
      var g = new THREE.Group();
      var tr = new THREE.Mesh(new THREE.CylinderGeometry(.22 * sc, .34 * sc, 3.4 * sc, 7),
        new THREE.MeshStandardMaterial({color:0x2a242a, roughness:1}));
      tr.position.y = 1.7 * sc;
      g.add(tr);
      var leaf = new THREE.MeshStandardMaterial({color:0x24352c, roughness:1});
      for(var i = 0; i < 4; i++){
        var b = new THREE.Mesh(new THREE.SphereGeometry(1.5 * sc, 9, 7), leaf);
        b.position.set((Math.random()-.5)*1.7*sc, (3.3 + Math.random()*1.2) * sc, (Math.random()-.5)*1.7*sc);
        b.castShadow = true;
        g.add(b);
      }
      g.position.set(x, 0, z);
      scene.add(g);
    }
    tree(-16, -9, 1.25); tree(15, -11, 1.05); tree(20, 2, 1.35); tree(-21, 3, 1.15);

    /* the low sun doing all the work — the club's pink, straight from the sky */
    var sun = glowSprite(26, 0xff7fae, .9);
    sun.position.set(-26, 5.5, -46);
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xffa9ca, 0x201a20, .58));
    var key = new THREE.DirectionalLight(0xff87ae, 1.7);
    key.position.set(-24, 11, -30);
    key.castShadow = true;
    key.shadow.mapSize.set(isSmall ? 1024 : 2048, isSmall ? 1024 : 2048);
    key.shadow.camera.near = 1; key.shadow.camera.far = 90;
    key.shadow.camera.left = -22; key.shadow.camera.right = 22;
    key.shadow.camera.top = 22; key.shadow.camera.bottom = -22;
    key.shadow.bias = -0.0006;
    scene.add(key);
    var fill = new THREE.DirectionalLight(0x9aa2ad, .68);
    fill.position.set(14, 9, 16);
    scene.add(fill);

    /* dust hanging in the late light */
    var dn = isSmall ? 90 : 200, da = new Float32Array(dn * 3);
    for(var d0 = 0; d0 < dn; d0++){
      da[d0*3] = (Math.random()*2-1)*16; da[d0*3+1] = Math.random()*7; da[d0*3+2] = (Math.random()*2-1)*12;
    }
    var dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(da, 3));
    scene.add(new THREE.Points(dg, new THREE.PointsMaterial({color:0xffc2d8, size:.055,
      transparent:true, opacity:.6, blending:THREE.AdditiveBlending, depthWrite:false})));

    bounds = {x:9.2, z1:-9.2, z2:9.2};
    home = {yaw:.16, pitch:.2, radius:13.5, from:{yaw:-.75, pitch:.02, radius:4.4}};
    target.set(0, 1.3, 0);

    var MAXB = isSmall ? 9 : 14;
    onTap = function(){
      ensureAudio();
      var b = new Ball(0.42, (Math.random()*2-1)*4.5, 7.5 + Math.random()*2, (Math.random()*2-1)*3.5);
      b.v.set((Math.random()*2-1)*1.6, -1, (Math.random()*2-1)*1.6);
      b.axis.set(Math.random()*2-1, Math.random()*.6-.3, Math.random()*2-1).normalize();
      b.spin = 3 + Math.random()*4;
      balls.push(b);
      sSpawn();
      shake = Math.min(1, shake + .18);
      if(aEl) aEl.textContent = balls.length;
      if(bEl) bEl.textContent = (+bEl.textContent + 1);
      if(balls.length >= MAXB){ balls.shift().remove(); if(aEl) aEl.textContent = balls.length; }
      var total = bEl ? +bEl.textContent : 0;
      if(total && total % 10 === 0){ sWhistle(); popMsg(total + ' AND COUNTING'); }
    };
    tick = function(dt){
      for(var i = 0; i < balls.length; i++){
        balls[i].step(dt, bounds, function(v){ sBounce(v); });
      }
      collide(balls);
      var dp = dg.attributes.position.array;
      for(var k = 0; k < dn; k++){
        dp[k*3+1] += .16 * dt;
        if(dp[k*3+1] > 7) dp[k*3+1] = 0;
      }
      dg.attributes.position.needsUpdate = true;
    };
    setHint('Tap the court · one more every time');
  }

  /* ======================================================================
     SCENE — rebound wall under one floodlight
     ====================================================================== */
  if(mode === 'gila'){
    scene.fog = new THREE.Fog(0x090b0e, 22, 78);
    skyDome([[0,'#04060a'],[.42,'#0a0f16'],[.62,'#141b24'],[.8,'#1c242e'],[1,'#070809']], 90);

    var stars = [];
    for(var si = 0; si < (isSmall ? 130 : 240); si++){
      var az = Math.random() * Math.PI * 2, el = .3 + Math.random() * 1.1, rr = 70;
      stars.push(rr*Math.cos(el)*Math.sin(az), rr*Math.sin(el), rr*Math.cos(el)*Math.cos(az));
    }
    var sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
    var starMat = new THREE.PointsMaterial({color:0xcfe0f5, size:.5, transparent:true, opacity:.8, fog:false});
    scene.add(new THREE.Points(sg, starMat));

    /* worn concrete */
    var gc = document.createElement('canvas'); gc.width = gc.height = 1024;
    var gx = gc.getContext('2d');
    gx.fillStyle = '#2a2c30'; gx.fillRect(0, 0, 1024, 1024);
    for(var q = 0; q < 9000; q++){
      gx.fillStyle = ['#242629','#31343a','#2b2e33','#3a3d44'][(Math.random()*4)|0];
      gx.globalAlpha = .35;
      gx.fillRect(Math.random()*1024, Math.random()*1024, 3, 3);
    }
    gx.globalAlpha = .5; gx.strokeStyle = '#4a4e56'; gx.lineWidth = 3;
    for(var l = 0; l < 6; l++){
      gx.beginPath();
      var lx = Math.random()*1024;
      gx.moveTo(lx, 0); gx.lineTo(lx + (Math.random()*200-100), 1024); gx.stroke();
    }
    gx.globalAlpha = 1;
    var groundTex = new THREE.CanvasTexture(gc);
    groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(3, 3);
    groundTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(70, 70),
      new THREE.MeshStandardMaterial({map:groundTex, roughness:.95, metalness:.03}));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    /* the rebound board — the whole point of the place */
    var boardMat = new THREE.MeshStandardMaterial({color:0x3b3f46, roughness:.7, metalness:.15});
    var BOARD_Z = -7.2;
    var board = new THREE.Mesh(new THREE.BoxGeometry(11, 4.6, .5), boardMat);
    board.position.set(0, 2.3, BOARD_Z);
    board.castShadow = board.receiveShadow = true;
    scene.add(board);
    /* a target square, scuffed by years of being hit */
    var tgt = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.2),
      new THREE.MeshStandardMaterial({color:0xff5a1f, roughness:.85, transparent:true, opacity:.55}));
    tgt.position.set(0, 2.1, BOARD_Z + .26);
    scene.add(tgt);
    for(var bp = -1; bp <= 1; bp += 2){
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 4.6, 8), boardMat);
      leg.position.set(bp * 5.2, 2.3, BOARD_Z - .5);
      leg.castShadow = true;
      scene.add(leg);
    }

    /* training cones */
    var coneMat = new THREE.MeshStandardMaterial({color:0xff5a1f, roughness:.75});
    [[-3.4,1.2],[-1.7,2.6],[0,1.2],[1.7,2.6],[3.4,1.2]].forEach(function(c){
      var m = new THREE.Mesh(new THREE.ConeGeometry(.26, .55, 12), coneMat);
      m.position.set(c[0], .275, c[1]);
      m.castShadow = true;
      scene.add(m);
    });

    /* one floodlight, and the haze it makes */
    var poleMat = new THREE.MeshStandardMaterial({color:0x15191f, roughness:.8});
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(.12, .2, 10.5, 10), poleMat);
    pole.position.set(-8.5, 5.25, -3);
    pole.castShadow = true;
    scene.add(pole);
    var head = new THREE.Mesh(new THREE.BoxGeometry(1.9, .55, .35), poleMat);
    head.position.set(-8.5, 10.6, -3);
    scene.add(head);
    var lamp = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .4),
      new THREE.MeshBasicMaterial({color:0xdcecff, fog:false}));
    lamp.position.set(-8.5, 10.6, -2.78);
    scene.add(lamp);
    var lampGlow = glowSprite(6.5, 0xbcd8ff, .85);
    lampGlow.position.set(-8.5, 10.6, -2.6);
    scene.add(lampGlow);
    (function beam(){
      var from = new THREE.Vector3(-8.5, 10.4, -3), to = new THREE.Vector3(.5, 0, 0);
      var len = from.distanceTo(to);
      var g = new THREE.ConeGeometry(3.6, len, 24, 1, true);
      g.translate(0, -len / 2, 0);
      var m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({color:0xbcd8ff, transparent:true,
        opacity:.035, blending:THREE.AdditiveBlending, depthWrite:false,
        side:THREE.DoubleSide, fog:false}));
      m.position.copy(from);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0), to.clone().sub(from).normalize());
      scene.add(m);
    })();

    scene.add(new THREE.HemisphereLight(0x2c3a4d, 0x0b0d10, .5));
    var spot = new THREE.SpotLight(0xdcecff, 3.4, 46, .62, .5, 1.4);
    spot.position.set(-8.5, 10.4, -3);
    spot.target.position.set(.5, 0, 0);
    spot.castShadow = true;
    spot.shadow.mapSize.set(isSmall ? 1024 : 2048, isSmall ? 1024 : 2048);
    spot.shadow.camera.near = 2; spot.shadow.camera.far = 46;
    spot.shadow.bias = -0.0005;
    scene.add(spot); scene.add(spot.target);
    var rim = new THREE.DirectionalLight(0xff7a3c, .45);
    rim.position.set(9, 4, 8);
    scene.add(rim);

    var dn2 = isSmall ? 70 : 150, da2 = new Float32Array(dn2 * 3);
    for(var e0 = 0; e0 < dn2; e0++){
      da2[e0*3] = -8.5 + (Math.random()*2-1)*7;
      da2[e0*3+1] = Math.random()*8;
      da2[e0*3+2] = -3 + (Math.random()*2-1)*5;
    }
    var dg2 = new THREE.BufferGeometry();
    dg2.setAttribute('position', new THREE.BufferAttribute(da2, 3));
    scene.add(new THREE.Points(dg2, new THREE.PointsMaterial({color:0xcfe2ff, size:.05,
      transparent:true, opacity:.5, blending:THREE.AdditiveBlending, depthWrite:false})));

    home = {yaw:-.1, pitch:.17, radius:11.5, from:{yaw:-.85, pitch:.02, radius:4.2}};
    target.set(0, 1.5, -1.5);

    var ball = new Ball(0.42, 0, .42, 4.2);
    var reps = 0, best = 0, live = false;

    onTap = function(){
      ensureAudio();
      /* strike it at the board */
      ball.p.set((Math.random()*2-1)*.7, .55, 4.0);
      ball.v.set((Math.random()*2-1)*1.1, 3.4 + Math.random()*1.2, -13.5 - Math.random()*2);
      ball.axis.set(Math.random()*2-1, Math.random()*.5-.25, Math.random()*2-1).normalize();
      ball.spin = 7 + Math.random()*5;
      live = true;
      sKick();
      shake = Math.min(1, shake + .5);
      flashHint('Again');
    };
    tick = function(dt){
      ball.step(dt, {x:15, z1:-14, z2:14}, function(v){ sBounce(v); });
      /* the board: a plane the ball comes back off */
      if(live && ball.v.z < 0 &&
         ball.p.z - ball.R <= BOARD_Z + .25 &&
         ball.p.z > BOARD_Z - 1.5 &&
         Math.abs(ball.p.x) < 5.5 && ball.p.y < 4.6){
        ball.p.z = BOARD_Z + .25 + ball.R;
        var sp = -ball.v.z;
        ball.v.z = sp * .74;
        ball.v.x *= .8;
        ball.v.y += .6;
        ball.spin = 5 + sp * .4;
        sWall(sp);
        shake = Math.min(1, shake + .28);
        reps++;
        if(reps > best) best = reps;
        if(aEl) aEl.textContent = reps;
        if(bEl) bEl.textContent = best;
        if(reps % 10 === 0){ sWhistle(); popMsg(reps + ' REPS'); }
        live = false;
      }
      /* it has stopped: the rep chain is over */
      if(ball.rest > 1.4 && reps > 0){
        reps = 0;
        if(aEl) aEl.textContent = 0;
        ball.rest = 0;
        flashHint('Chain broken · hit it again');
      }
      var dp2 = dg2.attributes.position.array;
      for(var k2 = 0; k2 < dn2; k2++){
        dp2[k2*3+1] += .12 * dt;
        if(dp2[k2*3+1] > 8) dp2[k2*3+1] = 0;
      }
      dg2.attributes.position.needsUpdate = true;
      starMat.opacity = .65 + .2 * Math.sin(performance.now() * .0006);
    };
    setHint('Tap to strike the board · drag to look');
  }

  /* ---------- input ---------- */
  var down = false, dragging = false, sx = 0, sy = 0, st = 0, y0 = 0, p0 = 0;
  host.addEventListener('pointerdown', function(e){
    down = true; dragging = false;
    sx = e.clientX; sy = e.clientY; st = performance.now();
    y0 = yawT; p0 = pitchT;
    if(host.setPointerCapture){ try{ host.setPointerCapture(e.pointerId); }catch(err){} }
  });
  host.addEventListener('pointermove', function(e){
    if(craning) return;
    if(down){
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if(!dragging && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) dragging = true;
      if(dragging){
        yawT = THREE.MathUtils.clamp(y0 - dx * .005, home.yaw - .65, home.yaw + .65);
        pitchT = THREE.MathUtils.clamp(p0 + dy * .003, .07, .48);
      }
    }else if(hoverCap){
      var r = host.getBoundingClientRect();
      yawT = home.yaw + ((e.clientX - r.left) / r.width - .5) * .3;
      pitchT = home.pitch + ((e.clientY - r.top) / r.height - .5) * .09;
    }
  });
  function up(){
    if(!down) return;
    down = false;
    if(!dragging && performance.now() - st < 400) onTap();
    dragging = false;
  }
  host.addEventListener('pointerup', up);
  host.addEventListener('pointercancel', function(){ down = false; dragging = false; });
  host.addEventListener('keydown', function(e){
    if(e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); onTap(); }
  });
  host.addEventListener('contextmenu', function(e){ e.preventDefault(); });

  /* ---------- resize, visibility, loop ---------- */
  function resize(){
    var w = host.clientWidth, h = host.clientHeight;
    if(!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = camera.aspect < .85 ? 52 : 40;
    camFit = camera.aspect < .85 ? 1.24 : 1;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  var running = true;
  if('IntersectionObserver' in window && hero){
    new IntersectionObserver(function(en){ running = en[0].isIntersecting; },
      {threshold:.02}).observe(hero);
  }
  window.addEventListener('scroll', function(){
    var h = hero ? hero.offsetHeight : 1;
    scrollLift = THREE.MathUtils.clamp((window.scrollY || 0) / (h || 1), 0, 1);
  }, {passive:true});

  if(hero) hero.classList.add('has-stage');

  var clock = new THREE.Clock();
  (function loop(){
    requestAnimationFrame(loop);
    var dt = Math.min(clock.getDelta(), .033);
    if(!running || document.hidden) return;
    tick(dt);
    updCam(clock.elapsedTime, dt);
    renderer.render(scene, camera);
  })();

}catch(err){
  if(hero) hero.classList.remove('has-stage');
}
}
})();
