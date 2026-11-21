// main.js — Spot the Twins: the game itself.
//
// What it does, in one place: two near-identical pictures side by side (the
// left is the original, the right carries 8 sneaky changes), a countdown, a
// score with a streak multiplier, 3 hints per level, a 2x magnifier lens,
// full keyboard play, WebAudio sound effects, 8 levels, stars per level and
// a results screen. No network, no libraries, no files outside game/.
//
// Screenshot mode: with ?shot=start|play|play2|end in the URL, shots.js
// stages a frozen, deterministic frame instead of a live game (see shots.js).

import { SCENES } from './scenes.js';
import { stageShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const svgL = $('svgL');
const svgR = $('svgR');
const frameL = $('frameL');
const frameR = $('frameR');

const BEST_KEY = 'spot-the-twins-best';
const MULT_STEP = 0.25; // each find in a row adds x0.25, up to x3

const state = {
  level: 0,
  found: new Set(),
  score: 0,
  streak: 0,
  timeLeft: 150,
  hints: 3,
  screen: 'title', // title | play | complete | fail | results
  paused: false,
  muted: false,
  lensOn: true,
  frozen: false, // screenshot mode: the timer never ticks
  newest: null, // id of the most recent find, for the pop animation
  hintId: null,
  hintTimer: 0,
  stars: {}, // level index -> 1..3
  totalScore: 0,
  done: new Set(),
};

let timerId = 0;
let audioCtx = null;
let lensSourceL = '';
let lensSourceR = '';

/* ---------------------------------------------------------- sound (WebAudio) */
function tone(freq, dur, type = 'sine', when = 0, vol = 0.12) {
  if (state.muted) return;
  try {
    audioCtx = audioCtx ?? new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime + when;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur);
  } catch { /* headless / no audio: the game plays on silently */ }
}
const sfx = {
  click: () => tone(1200, 0.04, 'sine', 0, 0.05),
  found: () => { tone(660, 0.1); tone(880, 0.16, 'sine', 0.09); },
  miss: () => tone(140, 0.18, 'sawtooth', 0, 0.08),
  hint: () => tone(520, 0.12, 'triangle'),
  complete: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', i * 0.11, 0.1)); },
};

/* ---------------------------------------------------------- rendering */
function marksSvg(panel) {
  const scene = SCENES[state.level];
  let out = '';
  for (const id of state.found) {
    const d = scene.diffs.find((x) => x.id === id);
    if (!d) continue;
    const x = panel === 'R' ? (d.x2 ?? d.x) : d.x;
    const y = panel === 'R' ? (d.y2 ?? d.y) : d.y;
    const r = d.r + 7;
    const pop = id === state.newest ? ' class="found-ring"' : '';
    out += `<g${pop}><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#34d399" stroke-width="4"/>` +
      `<circle cx="${x}" cy="${y}" r="${r - 9}" fill="none" stroke="#34d399" stroke-width="2" opacity="0.55"/>` +
      `<path d="M${x - 9} ${y} L${x - 2} ${y + 8} L${x + 11} ${y - 8}" fill="none" stroke="#34d399" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  }
  if (state.hintId) {
    const d = scene.diffs.find((x) => x.id === state.hintId);
    if (d && !state.found.has(d.id)) {
      const x = panel === 'R' ? (d.x2 ?? d.x) : d.x;
      const y = panel === 'R' ? (d.y2 ?? d.y) : d.y;
      out += `<g class="hint-ring"><circle cx="${x}" cy="${y}" r="${d.r + 10}" fill="none" stroke="#f5b942" stroke-width="5"/></g>`;
    }
  }
  return out;
}

function renderScene() {
  const scene = SCENES[state.level];
  const all = new Set(scene.diffs.map((d) => d.id));
  svgL.innerHTML = scene.draw(new Set()) + marksSvg('L');
  svgR.innerHTML = scene.draw(all) + marksSvg('R');
  lensSourceL = svgL.innerHTML;
  lensSourceR = svgR.innerHTML;
}

function fmtTime(s) {
  const m = Math.floor(Math.max(0, s) / 60);
  const ss = Math.floor(Math.max(0, s) % 60);
  return `${m}:${String(ss).padStart(2, '0')}`;
}

function mult() {
  return 1 + Math.min(state.streak, 8) * MULT_STEP;
}

function renderHud() {
  const scene = SCENES[state.level];
  const left = scene.diffs.length - state.found.size;
  $('leftCount').textContent = String(left);
  $('foundDots').innerHTML = scene.diffs.map((d) =>
    `<i class="${state.found.has(d.id) ? 'on' : ''}" title="${d.note}"></i>`).join('');
  $('timerText').textContent = fmtTime(state.timeLeft);
  $('scoreText').textContent = String(state.score);
  $('streakText').textContent = `×${mult().toFixed(2).replace(/\.?0+$/, '')}`;
  $('streakPill').classList.toggle('hot', state.streak >= 4);
  $('hintBtn').textContent = `Hint (${state.hints})`;
  $('hintBtn').disabled = state.hints === 0 || state.screen !== 'play';
  $('levelNameL').textContent = `${state.level + 1} · ${scene.name}`;
  const fill = $('timebarFill');
  fill.style.width = `${Math.max(0, (state.timeLeft / scene.par) * 100)}%`;
  fill.classList.toggle('low', state.timeLeft <= 30);
  renderLevelBar();
}

function renderLevelBar() {
  const bar = $('levelsBar');
  bar.innerHTML = SCENES.map((s, i) => {
    const stars = state.stars[i] ? '★'.repeat(state.stars[i]) : '·';
    const cls = `${i === state.level ? 'now' : ''} ${state.done.has(i) ? 'done' : ''}`;
    return `<button data-level="${i}" class="${cls}">${i + 1}. ${s.name}<small>${stars}</small></button>`;
  }).join('');
  bar.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => loadLevel(Number(b.dataset.level))));
  const grid = $('titleLevels');
  if (grid && !grid.dataset.built) {
    grid.dataset.built = '1';
    grid.innerHTML = SCENES.map((s, i) =>
      `<button data-level="${i}">${i + 1}. ${s.name}<small>8 differences · par ${fmtTime(s.par)}</small></button>`).join('');
    grid.querySelectorAll('button').forEach((b) =>
      b.addEventListener('click', () => { loadLevel(Number(b.dataset.level)); startGame(); }));
  }
}

function announce(msg) {
  $('status').textContent = msg;
}

/* ---------------------------------------------------------- level flow */
function loadLevel(i, opts = {}) {
  state.level = i;
  state.found = new Set(opts.found ?? []);
  state.streak = opts.streak ?? 0;
  state.timeLeft = opts.timeLeft ?? SCENES[i].par;
  state.hints = opts.hints ?? 3;
  state.newest = null;
  state.hintId = null;
  if (opts.score !== undefined) state.score = opts.score;
  renderScene();
  renderHud();
}

function startGame() {
  $('titleOverlay').hidden = true;
  state.screen = 'play';
  startTimer();
  announce(`Level ${state.level + 1}: ${SCENES[state.level].name}. Find 8 differences.`);
}

function startTimer() {
  stopTimer();
  if (state.frozen) return;
  timerId = window.setInterval(() => {
    if (state.screen !== 'play' || state.paused) return;
    state.timeLeft = Math.max(0, state.timeLeft - 0.25);
    if (state.timeLeft <= 0) return failLevel();
    renderHud();
  }, 250);
}
function stopTimer() {
  if (timerId) window.clearInterval(timerId);
  timerId = 0;
}

function levelComplete() {
  state.screen = 'complete';
  stopTimer();
  const bonus = Math.round(state.timeLeft) * 10;
  const stars = state.timeLeft >= 60 ? 3 : state.timeLeft >= 25 ? 2 : 1;
  state.stars[state.level] = Math.max(state.stars[state.level] ?? 0, stars);
  state.done.add(state.level);
  state.score += bonus;
  state.totalScore = state.score;
  sfx.complete();
  $('completeTitle').textContent = state.level === SCENES.length - 1
    ? 'Last world cleared!' : `${SCENES[state.level].name} — complete!`;
  $('completeStars').innerHTML = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  $('completeStats').innerHTML =
    `All 8 differences found with <b>${fmtTime(state.timeLeft)}</b> to spare.<br>` +
    `Time bonus <b>+${bonus}</b> · Score <b>${state.score}</b>`;
  $('nextBtn').textContent = state.level === SCENES.length - 1 ? 'See results' : 'Next level';
  $('completeModal').hidden = false;
  renderHud();
  announce(`Level complete. ${stars} stars, time bonus ${bonus}.`);
}

function failLevel() {
  state.screen = 'fail';
  stopTimer();
  tone(220, 0.4, 'sawtooth', 0, 0.08);
  $('failStats').innerHTML =
    `You found <b>${state.found.size} of 8</b> differences in ${SCENES[state.level].name}.<br>Try again — the differences are the same, your eyes are sharper now.`;
  $('failModal').hidden = false;
  announce('Out of time.');
}

function showResults() {
  state.screen = 'results';
  stopTimer();
  const best = Number(localStorage.getItem(BEST_KEY) ?? 0);
  const total = state.score;
  if (total > best) localStorage.setItem(BEST_KEY, String(total));
  $('finalScore').textContent = String(total);
  $('finalDetail').innerHTML =
    `8 worlds · 64 differences · ${Object.values(state.stars).reduce((a, b) => a + b, 0)} of 24 stars` +
    (total > best ? '<br><b>New best score!</b>' : '');
  $('finalBest').textContent = String(Math.max(best, total));
  $('resultsOverlay').hidden = false;
  announce(`All worlds cleared. Total score ${total}.`);
}

/* ---------------------------------------------------------- guessing */
function svgPoint(svg, clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * 800,
    y: ((clientY - rect.top) / rect.height) * 500,
  };
}

function guess(panel, x, y) {
  if (state.screen !== 'play' || state.paused) return;
  const scene = SCENES[state.level];
  const hit = scene.diffs.find((d) => {
    if (state.found.has(d.id)) return false;
    const dx = x - d.x;
    const dy = y - d.y;
    const dx2 = d.x2 !== undefined ? x - d.x2 : Infinity;
    const dy2 = d.y2 !== undefined ? y - d.y2 : Infinity;
    return (dx * dx + dy * dy <= d.r * d.r) || (dx2 * dx2 + dy2 * dy2 <= d.r * d.r);
  });
  if (hit) {
    state.found.add(hit.id);
    state.newest = hit.id;
    state.streak += 1;
    const gained = Math.round(100 * mult());
    state.score += gained;
    sfx.found();
    announce(`Found: ${hit.note}. ${scene.diffs.length - state.found.size} left. +${gained} points.`);
    renderScene();
    renderHud();
    if (state.found.size === scene.diffs.length) levelComplete();
  } else {
    state.streak = 0;
    state.timeLeft = Math.max(0, state.timeLeft - 5);
    sfx.miss();
    const frame = panel === 'L' ? frameL : frameR;
    frame.classList.remove('shake');
    void frame.offsetWidth;
    frame.classList.add('shake');
    const svg = panel === 'L' ? svgL : svgR;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'miss-x');
    g.innerHTML = `<path d="M${x - 12} ${y - 12} L${x + 12} ${y + 12} M${x + 12} ${y - 12} L${x - 12} ${y + 12}" stroke="#f87171" stroke-width="5" stroke-linecap="round"/>`;
    svg.appendChild(g);
    window.setTimeout(() => g.remove(), 950);
    announce('Not a difference. 5 seconds lost.');
    renderHud();
    if (state.timeLeft <= 0) failLevel();
  }
}

/* ---------------------------------------------------------- hint */
function useHint() {
  if (state.screen !== 'play' || state.paused || state.hints <= 0) return;
  const scene = SCENES[state.level];
  const left = scene.diffs.filter((d) => !state.found.has(d.id));
  if (!left.length) return;
  state.hints -= 1;
  state.hintId = left[Math.floor(Math.random() * left.length)].id;
  sfx.hint();
  renderScene();
  renderHud();
  announce(`Hint: look near the pulsing ring. ${state.hints} hints left.`);
  window.clearTimeout(state.hintTimer);
  state.hintTimer = window.setTimeout(() => {
    state.hintId = null;
    renderScene();
  }, 3000);
}

/* ---------------------------------------------------------- magnifier lens */
const lens = $('lens');
const lensSvg = $('lensSvg');
let lensPanel = 'L';

function moveLens(clientX, clientY, panel) {
  if (!state.lensOn || state.screen === 'title') return;
  lensPanel = panel;
  const svg = panel === 'L' ? svgL : svgR;
  const p = svgPoint(svg, clientX, clientY);
  const src = panel === 'L' ? lensSourceL : lensSourceR;
  lensSvg.innerHTML = `<g transform="translate(${85 - p.x * 2} ${85 - p.y * 2}) scale(2)">${src}</g>`;
  lens.style.display = 'block';
  lens.style.left = `${clientX - 85}px`;
  lens.style.top = `${clientY - 85}px`;
}
function hideLens() {
  lens.style.display = 'none';
}

/* ---------------------------------------------------------- keyboard crosshair */
const cross = $('crosshair');
const crossPos = { panel: 'R', x: 400, y: 250 };
let crossVisible = false;

function showCrosshair() {
  const svg = crossPos.panel === 'L' ? svgL : svgR;
  const rect = svg.getBoundingClientRect();
  cross.style.display = 'block';
  cross.style.left = `${rect.left + (crossPos.x / 800) * rect.width}px`;
  cross.style.top = `${rect.top + (crossPos.y / 500) * rect.height}px`;
  crossVisible = true;
}
function moveCross(dx, dy) {
  crossPos.x = Math.max(10, Math.min(790, crossPos.x + dx));
  crossPos.y = Math.max(10, Math.min(490, crossPos.y + dy));
  showCrosshair();
}

window.addEventListener('keydown', (e) => {
  if (state.screen === 'title') {
    if (e.key === 'Enter') startGame();
    return;
  }
  const step = e.shiftKey ? 40 : 12;
  if (e.key === 'ArrowLeft') { moveCross(-step, 0); e.preventDefault(); }
  else if (e.key === 'ArrowRight') { moveCross(step, 0); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { moveCross(0, -step); e.preventDefault(); }
  else if (e.key === 'ArrowDown') { moveCross(0, step); e.preventDefault(); }
  else if (e.key === 'Tab') {
    crossPos.panel = crossPos.panel === 'L' ? 'R' : 'L';
    if (crossVisible) showCrosshair();
    e.preventDefault();
  } else if (e.key === 'Enter') {
    if (crossVisible) guess(crossPos.panel, crossPos.x, crossPos.y);
    else { showCrosshair(); }
    e.preventDefault();
  } else if (e.key === 'h' || e.key === 'H') useHint();
  else if (e.key === 'p' || e.key === 'P') togglePause();
  else if (e.key === 'r' || e.key === 'R') { loadLevel(state.level); if (state.screen !== 'play') startGame(); }
  else if (e.key === 'n' || e.key === 'N') nextLevel();
  else if (e.key === 'm' || e.key === 'M') toggleSound();
  else if (/^[1-8]$/.test(e.key)) { loadLevel(Number(e.key) - 1); if (state.screen !== 'play') startGame(); }
});

/* ---------------------------------------------------------- pause / sound / lens */
function togglePause() {
  if (state.screen !== 'play' && !state.paused) return;
  state.paused = !state.paused;
  $('pauseOverlay').hidden = !state.paused;
  $('pauseBtn').textContent = state.paused ? 'Resume' : 'Pause';
  announce(state.paused ? 'Paused.' : 'Resumed.');
}
function toggleSound() {
  state.muted = !state.muted;
  $('soundBtn').textContent = state.muted ? 'Sound: Off' : 'Sound: On';
  if (!state.muted) sfx.click();
}
function toggleLens() {
  state.lensOn = !state.lensOn;
  $('magBtn').textContent = state.lensOn ? 'Lens: On' : 'Lens: Off';
  if (!state.lensOn) hideLens();
}

function nextLevel() {
  $('completeModal').hidden = true;
  if (state.level >= SCENES.length - 1) { showResults(); return; }
  loadLevel(state.level + 1);
  state.screen = 'play';
  startTimer();
}

/* ---------------------------------------------------------- wiring */
frameL.addEventListener('click', (e) => {
  sfx.click();
  const p = svgPoint(svgL, e.clientX, e.clientY);
  guess('L', p.x, p.y);
});
frameR.addEventListener('click', (e) => {
  sfx.click();
  const p = svgPoint(svgR, e.clientX, e.clientY);
  guess('R', p.x, p.y);
});
frameL.addEventListener('mousemove', (e) => moveLens(e.clientX, e.clientY, 'L'));
frameR.addEventListener('mousemove', (e) => moveLens(e.clientX, e.clientY, 'R'));
frameL.addEventListener('mouseleave', hideLens);
frameR.addEventListener('mouseleave', hideLens);

$('hintBtn').addEventListener('click', useHint);
$('pauseBtn').addEventListener('click', togglePause);
$('soundBtn').addEventListener('click', toggleSound);
$('magBtn').addEventListener('click', toggleLens);
$('startBtn').addEventListener('click', startGame);
$('nextBtn').addEventListener('click', nextLevel);
$('replayBtn').addEventListener('click', () => {
  $('completeModal').hidden = true;
  loadLevel(state.level);
  state.screen = 'play';
  startTimer();
});
$('retryBtn').addEventListener('click', () => {
  $('failModal').hidden = true;
  loadLevel(state.level);
  state.screen = 'play';
  startTimer();
});
$('resumeBtn').addEventListener('click', togglePause);
$('againBtn').addEventListener('click', () => {
  $('resultsOverlay').hidden = true;
  state.score = 0;
  state.stars = {};
  state.done = new Set();
  loadLevel(0);
  state.screen = 'play';
  startTimer();
});

/* ---------------------------------------------------------- boot */
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
loadLevel(0);
if (shot) {
  stageShot(shot, {
    state,
    loadLevel,
    startGame,
    showResults,
    renderHud,
    renderScene,
    setComplete: (stars, stats) => {
      $('completeTitle').textContent = 'Level complete!';
      $('completeStars').innerHTML = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      $('completeStats').innerHTML = stats;
      $('completeModal').hidden = false;
    },
    setResults: (total, detail, best) => {
      $('finalScore').textContent = String(total);
      $('finalDetail').innerHTML = detail;
      $('finalBest').textContent = String(best);
      $('resultsOverlay').hidden = false;
    },
  });
}
