// ── Theme sync (postMessage from index.html, same as other guide pages) ───
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'set-theme') {
    document.documentElement.setAttribute('data-theme', e.data.theme);
  }
});

// ── Constants ────────────────────────────────────────────────

const MECCA_LAT = 21.422487;
const MECCA_LNG = 39.826206;
const ALIGN_TOL  = 3;                   // ±3° = aligned
const VIB_PATTERN = [80, 60, 80];       // double pulse like verse.html
const VIB_COOLDOWN = 1500;              // ms between vibrations

// ── Elements ─────────────────────────────────────────────────
const disc        = document.getElementById('disc');
const kaabaG      = document.getElementById('kaaba-g');
const alignRing   = document.getElementById('align-ring');
const statusEl    = document.getElementById('status');
const alignedMsg  = document.getElementById('aligned-msg');
const distEl      = document.getElementById('distance');
const qiblaDegEl  = document.getElementById('qibla-deg');
const headingDegEl= document.getElementById('heading-deg');
const headingDirEl= document.getElementById('heading-dir');
const dirCells    = {
  n: document.getElementById('dir-n'),
  e: document.getElementById('dir-e'),
  s: document.getElementById('dir-s'),
  w: document.getElementById('dir-w'),
};

// ── State ─────────────────────────────────────────────────────
let qiblaBearing  = null;
let currentRot    = 0;      // smooth current disc rotation
let targetRot     = 0;      // target disc rotation
let lastVibration = 0;
let kaabaPlaced   = false;

// ── Math helpers ──────────────────────────────────────────────
const toRad = d => d * Math.PI / 180;

function calcQibla(lat, lng) {
  const phi = toRad(lat), lam = toRad(lng);
  const pK  = toRad(MECCA_LAT), lK = toRad(MECCA_LNG);
  const y   = Math.sin(lK - lam);
  const x   = Math.cos(phi) * Math.tan(pK) - Math.sin(phi) * Math.cos(lK - lam);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function calcDist(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dL = toRad(lat2 - lat1), dG = toRad(lon2 - lon1);
  const a  = Math.sin(dL/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dG/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function headingName(h) {
  const d = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return d[Math.round(h / 22.5) % 16];
}

function updateDirHighlight(h) {
  Object.values(dirCells).forEach(el => el.classList.remove('active'));
  const n = headingName(h);
  if (['N','NNE','NNW'].includes(n))      dirCells.n.classList.add('active');
  else if (['E','ENE','ESE'].includes(n)) dirCells.e.classList.add('active');
  else if (['S','SSE','SSW'].includes(n)) dirCells.s.classList.add('active');
  else if (['W','WNW','WSW'].includes(n)) dirCells.w.classList.add('active');
}

// ── Build compass wheel (tick marks + labels) ─────────────────
function buildWheel() {
  const NS = 'http://www.w3.org/2000/svg';
  const cx = 150, cy = 150, r = 140;

  // Remove old ticks if rebuilding after theme change
  const old = document.getElementById('wheel-ticks');
  if (old) old.remove();

  // Read current theme colours from CSS vars
  const cs       = getComputedStyle(document.documentElement);
  const colMaj   = cs.getPropertyValue('--t1').trim()    || '#ffffff';
  const colMid   = cs.getPropertyValue('--t2').trim()    || '#777777';
  const colMin   = cs.getPropertyValue('--t4').trim()    || '#3a3a3a';
  const colTiny  = cs.getPropertyValue('--disc-bd').trim()|| '#2a2a2a';
  const colNum   = cs.getPropertyValue('--t3').trim()    || '#555555';

  const g  = document.createElementNS(NS, 'g');
  g.id = 'wheel-ticks';

  // ── Tick marks every 5° ──────────────────────────────────────
  for (let deg = 0; deg < 360; deg += 5) {
    const rad   = toRad(deg - 90);  // -90: 0° points up
    const is90  = deg % 90 === 0;
    const is30  = deg % 30 === 0;
    const is10  = deg % 10 === 0;

    const len = is90 ? 22 : is30 ? 15 : is10 ? 10 : 6;
    const col = is90 ? colMaj : is30 ? colMid : is10 ? colMin : colTiny;
    const wid = is90 ? 2.5 : is30 ? 1.5 : 1;

    const x1 = cx + r * Math.cos(rad);
    const y1 = cy + r * Math.sin(rad);
    const x2 = cx + (r - len) * Math.cos(rad);
    const y2 = cy + (r - len) * Math.sin(rad);

    const ln = document.createElementNS(NS, 'line');
    ln.setAttribute('x1', x1.toFixed(2)); ln.setAttribute('y1', y1.toFixed(2));
    ln.setAttribute('x2', x2.toFixed(2)); ln.setAttribute('y2', y2.toFixed(2));
    ln.setAttribute('stroke', col);
    ln.setAttribute('stroke-width', wid);
    ln.setAttribute('stroke-linecap', 'round');
    g.appendChild(ln);

    // ── Degree numbers at 30° (skip cardinal positions) ──────────
    if (is30 && !is90) {
      const numR = r - 30;
      const tx = cx + numR * Math.cos(rad);
      const ty = cy + numR * Math.sin(rad);
      const t  = document.createElementNS(NS, 'text');
      t.setAttribute('x', tx.toFixed(2));
      t.setAttribute('y', ty.toFixed(2));
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('dominant-baseline', 'central');
      t.setAttribute('fill', colNum);
      t.setAttribute('font-size', '9');
      t.setAttribute('font-family', 'system-ui,-apple-system,sans-serif');
      t.textContent = deg;
      g.appendChild(t);
    }
  }

  // ── Cardinal & intercardinal labels ───────────────────────────
  const labels = [
    { t: 'N',  d:   0, fill: '#ff5252', size: 21, w: '800' },
    { t: 'NE', d:  45, fill: '#484848', size: 10, w: '600' },
    { t: 'E',  d:  90, fill: '#cccccc', size: 17, w: '700' },
    { t: 'SE', d: 135, fill: '#484848', size: 10, w: '600' },
    { t: 'S',  d: 180, fill: '#cccccc', size: 17, w: '700' },
    { t: 'SW', d: 225, fill: '#484848', size: 10, w: '600' },
    { t: 'W',  d: 270, fill: '#cccccc', size: 17, w: '700' },
    { t: 'NW', d: 315, fill: '#484848', size: 10, w: '600' },
  ];

  labels.forEach(({ t, d, fill, size, w }) => {
    const rad  = toRad(d - 90);
    const labR = r - 44;
    const tx   = cx + labR * Math.cos(rad);
    const ty   = cy + labR * Math.sin(rad);
    const txt  = document.createElementNS(NS, 'text');
    txt.setAttribute('x', tx.toFixed(2));
    txt.setAttribute('y', ty.toFixed(2));
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('dominant-baseline', 'central');
    txt.setAttribute('fill', fill);
    txt.setAttribute('font-size', size);
    txt.setAttribute('font-weight', w);
    txt.setAttribute('font-family', 'system-ui,-apple-system,sans-serif');
    txt.textContent = t;
    g.appendChild(txt);
  });

  // Insert tick group BEFORE kaaba-g so Kaaba renders on top
  disc.insertBefore(g, kaabaG);
}

// ── Position Kaaba on disc at qiblaBearing ────────────────────
// Kaaba-g starts at top (0°). Rotating it by qiblaBearing places it
// at the correct Qibla position on the compass face.
function placeKaaba(bearing) {
  kaabaG.style.transform = `rotate(${bearing}deg)`;
  kaabaPlaced = true;
}

// ── Smooth animation loop ─────────────────────────────────────
function animate() {
  let delta = targetRot - currentRot;
  delta = ((delta + 540) % 360) - 180;   // shortest-path wrap
  currentRot += delta * 0.1;             // lerp — increase for snappier

  // Rotate the entire disc (N tracks True North, Kaaba tracks Qibla)
  disc.style.transform = `rotate(${currentRot}deg)`;

  requestAnimationFrame(animate);
}

// ── Orientation handler ───────────────────────────────────────
function handleOrientation(event) {
  let heading = null;

  if (typeof event.webkitCompassHeading === 'number' && event.webkitCompassHeading >= 0) {
    heading = event.webkitCompassHeading;              // iOS
  } else if (event.alpha !== null) {
    heading = (360 - event.alpha) % 360;              // Android
  }

  if (heading === null || qiblaBearing === null) return;

  // Disc rotation:
  //   disc rotates by -heading  → N on disc always faces True North
  //   kaaba-g is pre-rotated by qiblaBearing on the disc
  //   → Net kaaba angle on screen = qiblaBearing - heading
  //   → When heading == qiblaBearing → kaaba at top (aligned with pointer) ✓
  targetRot = -heading;

  // ── Display ─────────────────────────────────────────────────
  headingDegEl.textContent = Math.round(heading);
  headingDirEl.textContent = headingName(heading);
  updateDirHighlight(heading);

  // ── Alignment check ──────────────────────────────────────────
  let error = Math.abs((qiblaBearing - heading + 360) % 360);
  if (error > 180) error = 360 - error;
  const aligned = error <= ALIGN_TOL;
  const now     = Date.now();

  alignedMsg.classList.toggle('show', aligned);
  alignRing.style.opacity = aligned ? '1' : '0';

  if (aligned) {
    statusEl.textContent   = '✓ Facing Qibla — Allahu Akbar!';
    statusEl.style.color   = '#D4AF37';
    if (navigator.vibrate && now - lastVibration > VIB_COOLDOWN) {
      navigator.vibrate(VIB_PATTERN);
      lastVibration = now;
    }
  } else {
    // Tell user which way to rotate and by how much
    const diff = ((qiblaBearing - heading + 360) % 360);
    const dir  = diff < 180 ? 'rotate right →' : '← rotate left';
    statusEl.textContent = `${Math.round(error)}° off Qibla — ${dir}`;
    statusEl.style.color = '#666';
  }
}

// ── Geo handlers ──────────────────────────────────────────────
function onGeoSuccess(pos) {
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;

  qiblaBearing = calcQibla(lat, lng);
  const dist   = calcDist(lat, lng, MECCA_LAT, MECCA_LNG);

  qiblaDegEl.textContent = Math.round(qiblaBearing);
  distEl.textContent     = Math.round(dist).toLocaleString();

  placeKaaba(qiblaBearing);

  if (statusEl.style.color !== 'rgb(212, 175, 55)') {
    statusEl.textContent = 'Rotate until 🕋 aligns with pointer';
    statusEl.style.color = '#666';
  }
}

function toast(msg) {
  const t = document.getElementById('toast');
  if (t) {
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
}

function onGeoError(err) {
  let msg = 'Please turn on location / GPS';
  if (err && err.code === 1) msg = 'Location denied — please allow';
  else if (err && err.message) msg = err.message;
  statusEl.textContent = msg;
  statusEl.style.color = '#cc3333';
  toast(msg);
}

// ── Start compass sensor (auto — no button) ───────────────────
function startOrientation() {
  const listen = () => {
    window.addEventListener('deviceorientation',         handleOrientation, true);
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
  };

  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS 13+ — try immediately, fallback to first touch
    DeviceOrientationEvent.requestPermission()
      .then(s => { if (s === 'granted') listen(); })
      .catch(() => {
        document.addEventListener('touchstart', function once() {
          DeviceOrientationEvent.requestPermission()
            .then(s => { if (s === 'granted') listen(); })
            .catch(console.warn);
          document.removeEventListener('touchstart', once);
        }, { once: true });
      });
  } else {
    listen();
  }
}

// ── Init ──────────────────────────────────────────────────────
function init() {
  buildWheel();   // Draw tick marks + cardinal labels onto disc

  async function startGeo() {
    statusEl.textContent = 'Locating you…';
    try {
      let coords = null;
      // 1. Try Capacitor Geolocation (triggers native location prompt)
      if (window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.Geolocation) {
        const Geo = window.Capacitor.Plugins.Geolocation;
        let perm = await Geo.checkPermissions().catch(() => ({location:'prompt'}));
        if (perm.location === 'denied') {
          perm = await Geo.requestPermissions({permissions:['location']}).catch(() => perm);
        }
        if (perm.location === 'granted' || perm.location === 'prompt') {
          const pos = await Geo.getCurrentPosition({enableHighAccuracy: true, timeout: 10000});
          coords = pos.coords;
          // Setup watch for continuous updates
          Geo.watchPosition({enableHighAccuracy: true, maximumAge: 60000}, (pos, err) => {
            if (pos) onGeoSuccess(pos);
          });
        } else {
          throw new Error('Location denied in app settings.');
        }
      }
      
      // 2. Fallback to Web Geolocation
      if (!coords && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError, {
          enableHighAccuracy: true, timeout: 12000, maximumAge: 30000
        });
        navigator.geolocation.watchPosition(onGeoSuccess, () => {}, {
          enableHighAccuracy: true, maximumAge: 60000
        });
        return; // success handled by callbacks
      } else if (coords) {
        onGeoSuccess({coords});
      } else {
        throw new Error('Geolocation not supported');
      }
    } catch(err) {
      onGeoError(err);
    }
  }

  startGeo();

  startOrientation();
  requestAnimationFrame(animate);  // start smooth render loop

  // Re-draw tick colours when theme changes at runtime
  new MutationObserver(() => buildWheel())
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

// ── Drawer Functions ──────────────────────────────────────────
function openDrawer() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
}
function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
}

window.addEventListener('load', init);