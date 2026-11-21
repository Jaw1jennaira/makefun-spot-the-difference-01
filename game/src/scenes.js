// scenes.js — the 8 worlds of Spot the Twins.
//
// Every scene is drawn by code (inline SVG, no stock art) so the two pictures
// are pixel-perfect twins except for the differences. A scene's draw(D) takes
// the set D of difference ids that are ACTIVE in that panel: the left panel
// draws with an empty set, the right panel with every difference on. A
// difference is one of: removed (not drawn), recoloured, moved, resized,
// flipped, or added (drawn only when active). Each scene declares 8
// differences with the click target (x, y, radius) a player must hit.
//
// All pictures share one coordinate space: viewBox 0 0 800 500.

const S = {
  c: (x, y, r, fill, ex = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${ex}/>`,
  e: (x, y, rx, ry, fill, ex = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${ex}/>`,
  r: (x, y, w, h, fill, ex = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${ex}/>`,
  p: (d, fill, ex = '') => `<path d="${d}" fill="${fill}" ${ex}/>`,
  t: (x, y, s, size, fill, anchor = 'middle', ex = '') =>
    `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-family="Segoe UI, system-ui, sans-serif" font-weight="700" ${ex}>${s}</text>`,
  g: (inner, attrs = '') => `<g ${attrs}>${inner}</g>`,
};

/** A soft white cloud made of three ellipses. */
function cloud(x, y, s, fill = '#ffffff') {
  return S.g(
    S.e(x, y, 34 * s, 20 * s, fill) + S.e(x - 26 * s, y + 8 * s, 24 * s, 15 * s, fill) + S.e(x + 28 * s, y + 8 * s, 26 * s, 16 * s, fill),
    'opacity="0.95"',
  );
}

/** A gull: two shallow arcs. */
function bird(x, y, s, stroke = '#3a4a5a') {
  return S.p(`M${x} ${y} Q${x + 7 * s} ${y - 8 * s} ${x + 14 * s} ${y} Q${x + 21 * s} ${y - 8 * s} ${x + 28 * s} ${y}`,
    'none', `stroke="${stroke}" stroke-width="${2.4 * s}" fill="none" stroke-linecap="round"`);
}

/** A leafy tree: trunk + three canopy circles. */
function tree(x, y, s, leaf = '#3f8f3a') {
  return S.g(
    S.r(x - 7 * s, y - 34 * s, 14 * s, 36 * s, '#7a4a21') +
    S.c(x, y - 58 * s, 30 * s, leaf) + S.c(x - 22 * s, y - 38 * s, 21 * s, leaf) + S.c(x + 22 * s, y - 38 * s, 21 * s, leaf),
  );
}

/** A simple fish, facing right unless flipped. */
function fish(x, y, s, fill, flip = false) {
  const body = S.e(x, y, 22 * s, 12 * s, fill) + S.p(`M${x - 18 * s} ${y} L${x - 32 * s} ${y - 11 * s} L${x - 32 * s} ${y + 11 * s} Z`, fill);
  const eye = S.c(x + (flip ? -10 : 10) * s, y - 3 * s, 2.6 * s, '#123');
  return S.g(body + eye, flip ? `transform="translate(${2 * x} 0) scale(-1 1)"` : '');
}

/** A five-petal flower. */
function flower(x, y, petal, center = '#ffd93b') {
  let petals = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    petals += S.c(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 6.5, petal);
  }
  return S.g(S.r(x - 1.5, y, 3, 26, '#3f8f3a') + petals + S.c(x, y, 6, center));
}

/** A four-point sparkle star. */
function star4(x, y, r, fill = '#fff8d0') {
  return S.p(`M${x} ${y - r} Q${x + r * 0.22} ${y - r * 0.22} ${x + r} ${y} Q${x + r * 0.22} ${y + r * 0.22} ${x} ${y + r} Q${x - r * 0.22} ${y + r * 0.22} ${x - r} ${y} Q${x - r * 0.22} ${y - r * 0.22} ${x} ${y - r} Z`, fill);
}

/** A pine tree: three stacked triangles + trunk. */
function pine(x, y, s, green = '#2e6b34') {
  return S.g(
    S.r(x - 4 * s, y - 8 * s, 8 * s, 12 * s, '#6b4423') +
    S.p(`M${x} ${y - 78 * s} L${x - 24 * s} ${y - 28 * s} L${x + 24 * s} ${y - 28 * s} Z`, green) +
    S.p(`M${x} ${y - 58 * s} L${x - 30 * s} ${y - 6 * s} L${x + 30 * s} ${y - 6 * s} Z`, green) +
    S.p(`M${x} ${y - 36 * s} L${x - 34 * s} ${y + 12 * s} L${x + 34 * s} ${y + 12 * s} Z`, green),
  );
}

export const SCENES = [
  // ---------------------------------------------------------------- 1. PARK
  {
    id: 'park', name: 'Sunny Park Picnic', par: 150,
    diffs: [
      { id: 'cloud2', x: 420, y: 62, r: 34, note: 'a cloud drifted away' },
      { id: 'sunrays', x: 690, y: 72, r: 52, note: 'the sun lost its rays' },
      { id: 'kite', x: 560, y: 208, r: 26, note: 'the kite lost its tail bows' },
      { id: 'apple', x: 106, y: 284, r: 14, note: 'an apple appeared on the tree' },
      { id: 'flower', x: 640, y: 452, r: 16, note: 'a flower changed colour' },
      { id: 'bottle', x: 498, y: 386, r: 18, x2: 532, y2: 386, note: 'the bottle slid along the blanket' },
      { id: 'dogspot', x: 152, y: 428, r: 18, note: 'the dog lost its spot' },
      { id: 'bird3', x: 622, y: 150, r: 16, note: 'an extra bird flew in' },
    ],
    draw(D) {
      const sunRays = D.has('sunrays') ? '' : [0, 45, 90, 135, 180, 225, 270, 315]
        .map((a) => {
          const rad = (a * Math.PI) / 180;
          return `<line x1="${690 + Math.cos(rad) * 48}" y1="${72 + Math.sin(rad) * 48}" x2="${690 + Math.cos(rad) * 62}" y2="${72 + Math.sin(rad) * 62}" stroke="#f2b705" stroke-width="5" stroke-linecap="round"/>`;
        }).join('');
      const kiteTail = D.has('kite') ? '' :
        S.p('M560 196 L556 232 L566 232 Z', '#e2574c') +
        S.c(558, 212, 4, '#7b61ff') + S.c(561, 228, 4, '#3d7dd9');
      return `
      <defs><linearGradient id="parkSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8ecdf5"/><stop offset="1" stop-color="#e6f5ff"/>
      </linearGradient></defs>
      ${S.r(0, 0, 800, 320, 'url(#parkSky)')}
      ${S.r(0, 320, 800, 180, '#79c25a')}
      ${S.r(0, 320, 800, 10, '#6aa84e')}
      ${sunRays}${S.c(690, 72, 38, '#ffd93b')}
      ${cloud(140, 82, 1)}${D.has('cloud2') ? '' : cloud(420, 62, 0.9)}${cloud(580, 130, 0.7)}
      ${bird(300, 112, 1)}${bird(352, 96, 0.8)}
      ${D.has('bird3') ? bird(622, 150, 0.9) : ''}
      ${tree(90, 332, 1.15)}${tree(724, 338, 0.9, '#4da66b')}${tree(252, 342, 0.7)}
      ${D.has('apple') ? S.c(106, 284, 9, '#e23b3b') + S.r(104, 274, 3, 7, '#3f8f3a') : ''}
      ${S.g(S.e(500, 300, 9, 6, '#e27ab0') + S.e(514, 296, 9, 6, '#b06ae2') + S.c(507, 296, 3, '#123'))}
      ${S.p('M560 168 L588 186 L560 204 L532 186 Z', '#ff8c42')}
      ${S.p('M560 186 L560 204 L560 168', '#e2574c', 'stroke="#c94f42" stroke-width="2" fill="none"')}
      ${kiteTail}
      ${S.p('M560 204 Q540 240 520 262', 'none', 'stroke="#5a4632" stroke-width="2" fill="none"')}
      ${S.g(S.r(300, 392, 220, 72, '#e2574c') + S.r(322, 392, 22, 24, '#fff') + S.r(366, 392, 22, 24, '#fff') + S.r(410, 392, 22, 24, '#fff') + S.r(454, 392, 22, 24, '#fff') + S.r(344, 416, 22, 24, '#fff') + S.r(388, 416, 22, 24, '#fff') + S.r(432, 416, 22, 24, '#fff') + S.r(322, 440, 22, 24, '#fff') + S.r(366, 440, 22, 24, '#fff') + S.r(410, 440, 22, 24, '#fff') + S.r(454, 440, 22, 24, '#fff'), 'opacity="0.98"')}
      ${S.g(S.r(330, 386, 62, 34, '#a06a35', 'rx="6"') + S.p('M336 388 Q361 362 392 388', 'none', 'stroke="#7a4a21" stroke-width="5" fill="none"') + S.r(330, 396, 62, 6, '#7a4a21'))}
      ${S.g(S.r(D.has('bottle') ? 514 : 480, 372, 16, 34, '#3d7d3a', 'rx="4"') + S.r(D.has('bottle') ? 518 : 484, 360, 8, 12, '#2c5c2a'))}
      ${S.p('M392 424 L414 424 L403 448 Z', '#f2c14e', 'stroke="#d9a53d" stroke-width="2"')}
      ${S.g(S.e(150, 432, 34, 20, '#e8a35c') + S.c(182, 414, 15, '#e8a35c') + S.c(172, 402, 6, '#e8a35c') + S.c(190, 400, 6, '#e8a35c') + S.p('M172 402 L168 388 L180 398 Z', D.has('dogear') ? '#222222' : '#7a4a21') + S.p('M190 400 L196 386 L198 400 Z', '#7a4a21') + S.c(186, 410, 2.4, '#123') + S.p('M120 424 Q104 414 108 400', 'none', 'stroke="#e8a35c" stroke-width="6" fill="none" stroke-linecap="round"') + (D.has('dogspot') ? '' : S.e(146, 428, 9, 6, '#7a4a21')))}
      ${flower(60, 452, '#ff7ab0')}${flower(210, 458, '#ff7ab0')}${flower(640, 452, D.has('flower') ? '#7b61ff' : '#ff7ab0')}${flower(742, 450, '#ffffff')}${flower(420, 466, '#ffd93b', '#e2574c')}
      `;
    },
  },

  // ------------------------------------------------------------- 2. LIBRARY
  {
    id: 'library', name: 'Cozy Library', par: 150,
    diffs: [
      { id: 'clock', x: 400, y: 46, r: 26, note: 'the clock shows a different time' },
      { id: 'spine', x: 122, y: 148, r: 14, note: 'a book spine changed colour' },
      { id: 'cattail', x: 196, y: 392, r: 16, note: 'the cat lost its tail' },
      { id: 'lamp', x: 648, y: 300, r: 30, note: 'the lamp stopped glowing' },
      { id: 'steam', x: 566, y: 344, r: 16, note: 'the tea stopped steaming' },
      { id: 'leaf', x: 742, y: 372, r: 14, note: 'the plant lost a leaf' },
      { id: 'stack', x: 306, y: 420, r: 16, note: 'a book vanished from the stack' },
      { id: 'frame', x: 622, y: 92, r: 24, note: 'the picture in the frame changed' },
    ],
    draw(D) {
      const pal = ['#d94f3d', '#3d7dd9', '#e2a63d', '#4da66b', '#7b61ff', '#e27ab0'];
      const shelf = (x, y, w) => {
        let books = '';
        let bx = x + 6;
        let i = 0;
        while (bx < x + w - 14) {
          const bw = 11 + ((i * 7) % 6);
          const bh = 34 + ((i * 13) % 12);
          const col = D.has('spine') && x === 40 && i === 5 ? '#3d7dd9' : pal[i % pal.length];
          books += S.r(bx, y - bh, bw, bh, col, 'stroke="#00000022" stroke-width="1"');
          bx += bw + 2; i++;
        }
        return S.r(x, y, w, 8, '#8a5a2e') + books;
      };
      const hands = D.has('clock')
        ? S.p('M400 46 L400 30', 'none', 'stroke="#222" stroke-width="3" stroke-linecap="round"') + S.p('M400 46 L414 50', 'none', 'stroke="#222" stroke-width="3" stroke-linecap="round"')
        : S.p('M400 46 L400 28', 'none', 'stroke="#222" stroke-width="3" stroke-linecap="round"') + S.p('M400 46 L412 52', 'none', 'stroke="#222" stroke-width="3" stroke-linecap="round"');
      return `
      ${S.r(0, 0, 800, 400, '#f6e7c8')}
      ${S.r(0, 400, 800, 100, '#c08a56')}
      ${S.e(400, 452, 260, 34, '#b3493e')}${S.e(400, 452, 200, 24, '#d98a4a')}
      ${S.g(S.r(40, 70, 260, 240, '#a06a35') + shelf(40, 122, 260) + shelf(40, 182, 260) + shelf(40, 242, 260) + shelf(40, 302, 260))}
      ${S.g(S.r(500, 70, 260, 240, '#a06a35') + shelf(500, 122, 260) + shelf(500, 182, 260) + shelf(500, 242, 260) + shelf(500, 302, 260))}
      ${S.g(S.r(340, 56, 120, 150, '#ffffff') + S.r(350, 66, 100, 130, '#bfe3f5') + S.c(428, 96, 18, '#ffd93b') + cloud(378, 150, 0.45) + S.r(394, 56, 10, 150, '#ffffff') + S.r(340, 124, 120, 10, '#ffffff') + S.r(322, 56, 18, 160, '#d96a6a') + S.r(460, 56, 18, 160, '#d96a6a'))}
      ${S.c(400, 46, 26, '#fffdf5', 'stroke="#8a5a2e" stroke-width="4"')}${hands}${S.c(400, 46, 3, '#222')}
      ${S.g(S.r(596, 66, 52, 52, '#8a5a2e') + S.r(602, 72, 40, 40, '#f6e7c8') + (D.has('frame') ? S.c(622, 96, 12, '#ffd93b') + S.p('M606 106 L622 88 L638 106 Z', '#ffd93b') : S.p('M604 108 L614 88 L622 100 L630 86 L640 108 Z', '#4da66b')))}
      ${S.g(S.r(96, 356, 120, 84, '#a63a3a', 'rx="12"') + S.r(108, 330, 96, 34, '#c05050', 'rx="10"') + S.r(96, 428, 14, 40, '#7a2a2a') + S.r(202, 428, 14, 40, '#7a2a2a'))}
      ${S.g(S.e(156, 356, 34, 16, '#f08c2e') + S.c(186, 344, 13, '#f08c2e') + S.p('M176 334 L172 320 L184 330 Z', '#f08c2e') + S.p('M194 332 L200 318 L202 334 Z', '#f08c2e') + S.c(190, 341, 2.2, '#123') + (D.has('cattail') ? '' : S.p('M124 352 Q108 344 112 330', 'none', 'stroke="#f08c2e" stroke-width="6" fill="none" stroke-linecap="round"')))}
      ${S.g(S.r(540, 356, 90, 12, '#8a5a2e') + S.r(548, 368, 8, 44, '#6b4423') + S.r(614, 368, 8, 44, '#6b4423'))}
      ${S.g((D.has('lamp') ? '' : S.c(648, 300, 34, 'rgba(255,217,122,0.45)') + S.c(648, 300, 22, 'rgba(255,217,122,0.6)')) + S.p('M628 300 L668 300 L660 268 L636 268 Z', '#2f7d5b') + S.r(646, 300, 4, 40, '#5a4632') + S.e(648, 344, 16, 5, '#5a4632'))}
      ${S.g(S.r(552, 344, 26, 18, '#ffffff', 'rx="4"') + S.p('M578 350 Q590 350 586 358', 'none', 'stroke="#9aa9c7" stroke-width="3" fill="none"') + (D.has('steam') ? '' : S.p('M560 338 Q556 330 560 322 M570 338 Q566 330 570 322', 'none', 'stroke="#9aa9c7" stroke-width="2.5" fill="none" stroke-linecap="round"')))}
      ${S.g(S.r(726, 392, 34, 30, '#c96a3b', 'rx="4"') + S.p('M730 392 Q724 366 736 356 M743 392 Q744 362 756 352', 'none', 'stroke="#3f8f3a" stroke-width="5" fill="none" stroke-linecap="round"') + (D.has('leaf') ? '' : S.e(742, 372, 8, 5, '#3f8f3a')) + S.e(734, 360, 7, 5, '#4da66b'))}
      ${S.g(S.r(286, 448, 46, 12, '#3d7dd9') + S.r(290, 436, 40, 12, '#e2a63d') + (D.has('stack') ? '' : S.r(294, 424, 34, 12, '#d94f3d')))}
      `;
    },
  },

  // -------------------------------------------------------------- 3. HARBOR
  {
    id: 'harbor', name: 'Harbor at Dusk', par: 150,
    diffs: [
      { id: 'beam', x: 742, y: 130, r: 30, note: 'the lighthouse beam went dark' },
      { id: 'roof', x: 246, y: 296, r: 26, note: 'a roof changed colour' },
      { id: 'sail', x: 566, y: 336, r: 26, note: 'a sail changed colour' },
      { id: 'crate', x: 210, y: 386, r: 18, x2: 240, y2: 386, note: 'a crate slid along the pier' },
      { id: 'buoy', x: 614, y: 306, r: 18, note: 'the buoy drifted away' },
      { id: 'fish', x: 500, y: 292, r: 20, note: 'the jumping fish is gone' },
      { id: 'gull', x: 300, y: 92, r: 16, note: 'a gull flew away' },
      { id: 'flag', x: 690, y: 78, r: 16, note: 'the lighthouse flag flipped' },
    ],
    draw(D) {
      const waves = [290, 330, 370, 410, 450].map((y) =>
        [60, 220, 380, 540, 700].map((x) => S.p(`M${x} ${y} Q${x + 14} ${y - 7} ${x + 28} ${y}`, 'none', 'stroke="#ffffff55" stroke-width="3" fill="none" stroke-linecap="round"')).join('')).join('');
      const house = (x, roof) => S.g(
        S.r(x, 306, 66, 44, '#f3e2c7', 'stroke="#c9a86a" stroke-width="2"') +
        S.p(`M${x - 6} 306 L${x + 33} 282 L${x + 72} 306 Z`, roof) +
        S.r(x + 26, 322, 14, 28, '#7a4a21') + S.r(x + 10, 314, 12, 12, '#ffd97a') + S.r(x + 46, 314, 12, 12, '#ffd97a'));
      return `
      <defs><linearGradient id="harborSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#ffe3b3"/>
      </linearGradient></defs>
      ${S.r(0, 0, 800, 260, 'url(#harborSky)')}
      ${S.c(140, 118, 34, '#ffdf6b')}
      ${cloud(300, 70, 0.9)}${cloud(520, 110, 0.7)}
      ${bird(240, 90, 1)}${D.has('gull') ? '' : bird(300, 92, 0.9)}${bird(360, 78, 0.8)}
      ${S.r(0, 260, 800, 240, '#2b6ea6')}${waves}
      ${S.g(S.r(664, 96, 52, 164, '#f3ede0') + S.r(664, 128, 52, 22, '#d94f3d') + S.r(664, 178, 52, 22, '#d94f3d') + S.r(664, 228, 52, 22, '#d94f3d') + S.r(658, 84, 64, 14, '#222') + S.r(674, 62, 32, 22, '#222') + S.c(690, 73, 9, '#ffd97a') + S.p(D.has('flag') ? 'M690 62 L668 70 L690 78 Z' : 'M690 62 L712 70 L690 78 Z', '#e2574c'))}
      ${D.has('beam') ? '' : S.p('M716 66 L790 44 L790 96 Z', 'rgba(255,223,107,0.5)')}
      ${house(84, '#c94f42')}${house(210, D.has('roof') ? '#3e7de2' : '#4a6fa5')}${house(336, '#4da66b')}
      ${S.g(S.p('M420 340 L470 340 L462 366 L428 366 Z', '#c0392b') + S.r(444, 292, 5, 52, '#5a4632') + S.p('M449 296 L449 338 L486 338 Z', '#ffffff') + S.p('M444 300 L444 338 L414 338 Z', '#ffe9b0'))}
      ${S.g(S.p('M548 352 L592 352 L586 372 L554 372 Z', '#2f5d8a') + S.r(568, 312, 4, 42, '#5a4632') + S.p('M572 316 L572 350 L600 350 Z', D.has('sail') ? '#ffffff' : '#ff8c42'))}
      ${S.g(S.r(56, 380, 300, 12, '#8a5a2e') + S.r(66, 392, 10, 34, '#6b4423') + S.r(180, 392, 10, 34, '#6b4423') + S.r(330, 392, 10, 34, '#6b4423'))}
      ${S.g(S.r(96, 356, 26, 24, '#a06a35', 'stroke="#7a4a21" stroke-width="2"') + S.p('M96 368 L122 368 M109 356 L109 380', 'none', 'stroke="#7a4a21" stroke-width="2"'))}
      ${S.g(S.r(D.has('crate') ? 240 : 210, 360, 26, 26, '#c98a3b', 'stroke="#7a4a21" stroke-width="2"') + S.p(`M${D.has('crate') ? 240 : 210} 373 L${(D.has('crate') ? 240 : 210) + 26} 373 M${(D.has('crate') ? 240 : 210) + 13} 360 L${(D.has('crate') ? 240 : 210) + 13} 386`, 'none', 'stroke="#7a4a21" stroke-width="2"'))}
      ${D.has('buoy') ? '' : S.g(S.c(614, 306, 13, '#ff8c42') + S.r(602, 300, 24, 7, '#ffffff') + S.r(612, 282, 3, 14, '#5a4632') + S.c(613, 280, 3, '#e23b3b'))}
      ${D.has('fish') ? '' : S.g(fish(500, 292, 0.9, '#ffd93b') + S.p('M478 306 Q490 318 502 306', 'none', 'stroke="#ffffff88" stroke-width="3" fill="none"'))}
      ${fish(180, 420, 0.8, '#ff9db0', true)}${fish(700, 440, 0.7, '#7be0c3')}
      `;
    },
  },

  // -------------------------------------------------- 4. MOUNTAIN CABIN NIGHT
  {
    id: 'cabin', name: 'Mountain Cabin Night', par: 150,
    diffs: [
      { id: 'moon', x: 672, y: 72, r: 14, note: 'a new crater appeared on the moon' },
      { id: 'window', x: 330, y: 356, r: 16, note: 'a cabin window went dark' },
      { id: 'smoke', x: 420, y: 268, r: 24, note: 'the chimney smoke vanished' },
      { id: 'pine', x: 524, y: 336, r: 22, note: 'a pine tree is missing' },
      { id: 'hat', x: 182, y: 396, r: 14, note: 'the snowman changed hats' },
      { id: 'sled', x: 566, y: 436, r: 24, x2: 602, y2: 436, note: 'the sled slid away' },
      { id: 'lantern', x: 452, y: 372, r: 18, note: 'the lantern went out' },
      { id: 'wood', x: 648, y: 446, r: 16, note: 'a log is missing from the pile' },
    ],
    draw(D) {
      const stars = [[60, 60], [140, 40], [220, 90], [300, 44], [380, 80], [470, 40], [540, 88], [740, 40], [90, 130], [250, 140], [580, 140], [730, 150], [40, 200], [180, 190], [420, 150], [660, 190]]
        .map(([x, y], i) => star4(x, y, i % 3 === 0 ? 7 : 5)).join('');
      const smoke = D.has('smoke') ? '' :
        S.c(408, 272, 10, '#cfd8e3aa') + S.c(420, 256, 13, '#cfd8e3aa') + S.c(434, 240, 16, '#cfd8e388');
      const sledX = D.has('sled') ? 602 : 566;
      return `
      ${S.r(0, 0, 800, 500, '#16233f')}
      ${stars}
      ${S.c(660, 80, 36, '#f4ead0')}${S.c(648, 70, 7, '#d9cba6')}${S.c(672, 92, 5, '#d9cba6')}${D.has('moon') ? S.c(672, 72, 5, '#d9cba6') : ''}
      ${S.p('M0 330 L200 120 L420 330 Z', '#33456b')}${S.p('M150 178 L200 120 L250 178 L228 168 L210 184 L190 166 Z', '#eef4fb')}
      ${S.p('M300 330 L560 150 L800 330 Z', '#2a3a5e')}${S.p('M510 200 L560 150 L610 200 L588 190 L572 206 L548 188 Z', '#eef4fb')}
      ${S.r(0, 330, 800, 170, '#eef4fb')}
      ${pine(120, 350, 1.1)}${pine(680, 360, 1.25)}${D.has('pine') ? '' : pine(524, 352, 0.7)}
      ${S.g(S.r(300, 330, 130, 76, '#7a4a21') + S.p('M288 332 L365 286 L442 332 Z', '#5a4632') + S.p('M288 332 L365 286 L442 332 L430 332 L365 296 L300 332 Z', '#ffffff') + S.r(352, 362, 26, 44, '#4a2c14') + S.c(372, 386, 3, '#ffd97a') + S.r(312, 348, 24, 20, '#ffd97a', 'stroke="#5a4632" stroke-width="2"') + S.r(392, 348, 24, 20, D.has('window') ? '#33415c' : '#ffd97a', 'stroke="#5a4632" stroke-width="2"') + S.r(404, 292, 16, 34, '#7a4a21') + S.r(398, 286, 28, 10, '#5a4632'))}
      ${smoke}
      ${S.g(S.e(182, 442, 26, 18, '#ffffff') + S.c(182, 414, 18, '#ffffff') + S.c(182, 392, 13, '#ffffff') + S.p('M190 390 L212 396 L190 398 Z', '#ff8c42') + S.c(178, 388, 2.4, '#123') + S.c(187, 388, 2.4, '#123') + S.r(170, 378, 24, 7, D.has('hat') ? '#c0392b' : '#222222') + S.r(174, 366, 16, 14, D.has('hat') ? '#c0392b' : '#222222') + S.c(182, 414, 2.4, '#123') + S.c(182, 426, 2.4, '#123'))}
      ${S.g(S.p(`M${sledX - 26} 448 L${sledX + 26} 448`, 'none', 'stroke="#8a5a2e" stroke-width="5" stroke-linecap="round"') + S.r(sledX - 22, 430, 44, 8, '#c0392b', 'rx="3"') + S.r(sledX - 18, 420, 6, 12, '#8a5a2e') + S.r(sledX + 12, 420, 6, 12, '#8a5a2e'))}
      ${S.g(S.r(448, 380, 5, 52, '#5a4632') + (D.has('lantern') ? S.c(450, 368, 9, '#8a93a6') : S.c(450, 368, 18, 'rgba(255,217,122,0.4)') + S.c(450, 368, 9, '#ffd97a')) + S.r(444, 356, 12, 6, '#222'))}
      ${S.g(S.e(640, 452, 7, 7, '#8a5a2e') + S.e(656, 452, 7, 7, '#6b4423') + (D.has('wood') ? '' : S.e(648, 438, 7, 7, '#a06a35')) + S.e(632, 438, 7, 7, '#7a4a21'))}
      ${S.e(240, 470, 5, 3, '#c9d6e8')}${S.e(268, 478, 5, 3, '#c9d6e8')}${S.e(296, 470, 5, 3, '#c9d6e8')}
      `;
    },
  },

  // ------------------------------------------------------ 5. LANTERN MARKET
  {
    id: 'market', name: 'Lantern Night Market', par: 150,
    diffs: [
      { id: 'bulb', x: 360, y: 138, r: 14, note: 'a festival bulb went out' },
      { id: 'sign', x: 195, y: 262, r: 26, note: 'the noodle stall changed its sign' },
      { id: 'lantern', x: 400, y: 224, r: 20, note: 'a lantern changed colour' },
      { id: 'tail', x: 668, y: 402, r: 16, note: 'the market cat lost its tail' },
      { id: 'moon', x: 690, y: 70, r: 30, note: 'the crescent moon flipped' },
      { id: 'star', x: 300, y: 58, r: 14, note: 'a new star appeared' },
      { id: 'awning', x: 560, y: 216, r: 18, note: 'an awning stripe changed colour' },
      { id: 'crate', x: 92, y: 436, r: 20, x2: 122, y2: 436, note: 'a crate slid along the ground' },
    ],
    draw(D) {
      const bulbs = [[120, 108], [200, 124], [280, 134], [360, 138], [440, 136], [520, 128], [600, 114], [680, 96]];
      const bulbCols = ['#ff5c8a', '#ffd93b', '#7be0c3', '#ff8c42', '#b06ae2', '#ff5c8a', '#ffd93b', '#7be0c3'];
      const bulbsSvg = bulbs.map(([x, y], i) =>
        (D.has('bulb') && i === 3) ? '' : S.c(x, y, 7, bulbCols[i]) + S.c(x - 2, y - 2, 2.5, '#ffffffcc')).join('');
      const awning2 = [0, 1, 2, 3, 4, 5].map((i) =>
        S.r(470 + i * 38, 200, 38, 26, D.has('awning') && i === 2 ? '#4da66b' : (i % 2 === 0 ? '#3d7dd9' : '#f3ede0'))).join('');
      return `
      ${S.r(0, 0, 800, 500, '#141b33')}
      ${star4(80, 60, 7)}${star4(180, 40, 5)}${star4(520, 48, 6)}${star4(760, 140, 5)}${star4(60, 180, 5)}
      ${D.has('star') ? star4(300, 58, 8, '#ffd93b') : ''}
      ${S.c(690, 70, 30, '#f4ead0')}${S.c(D.has('moon') ? 678 : 702, 62, 26, '#141b33')}
      ${S.p('M40 90 Q400 160 760 80', 'none', 'stroke="#3a2f2f" stroke-width="3" fill="none"')}
      ${bulbsSvg}
      ${S.g(S.r(90, 240, 210, 130, '#5a4632') + S.r(90, 240, 210, 12, '#3a2f2f') +
        [0, 1, 2, 3, 4].map((i) => S.r(90 + i * 42, 200, 42, 40, i % 2 === 0 ? '#e23b3b' : '#f3ede0')).join('') +
        S.r(90, 200, 210, 8, '#7a2a2a') +
        S.r(110, 280, 170, 54, '#2a2118') +
        S.t(195, 296, D.has('sign') ? 'RAMEN' : 'NOODLE', 26, '#ffd97a') +
        S.e(140, 250, 12, 16, '#e23b3b') + S.e(250, 250, 12, 16, '#ff8c42') +
        S.r(120, 340, 34, 26, '#c98a3b') + S.r(230, 340, 34, 26, '#a06a35'))}
      ${S.g(S.r(470, 240, 230, 130, '#3a2f4a') + S.r(470, 240, 230, 12, '#241a33') + awning2 +
        S.r(470, 200, 230, 8, '#2a3a5e') +
        S.r(490, 280, 190, 54, '#241a33') +
        S.t(585, 296, 'TEA · SWEETS', 20, '#7be0c3') +
        S.e(520, 250, 11, 15, '#ffd93b') + S.e(640, 250, 11, 15, '#ff5c8a') +
        S.r(500, 340, 30, 26, '#c98a3b') + S.r(630, 340, 30, 26, '#a06a35'))}
      ${S.g(S.e(400, 224, 16, 22, D.has('lantern') ? '#ffd93b' : '#e23b3b') + S.r(394, 200, 12, 6, '#f2b705') + S.r(394, 244, 12, 6, '#f2b705') + S.p('M400 200 L400 176', 'none', 'stroke="#3a2f2f" stroke-width="2"'))}
      ${S.p('M320 180 L340 180 L330 200 Z', '#ff5c8a')}${S.p('M360 184 L380 184 L370 204 Z', '#ffd93b')}${S.p('M420 184 L440 184 L430 204 Z', '#7be0c3')}${S.p('M460 180 L480 180 L470 200 Z', '#b06ae2')}
      ${S.g(S.r(D.has('crate') ? 90 : 60, 420, 64, 44, '#a06a35', 'stroke="#7a4a21" stroke-width="2"') + S.p(`M${D.has('crate') ? 90 : 60} 442 L${(D.has('crate') ? 90 : 60) + 64} 442 M${(D.has('crate') ? 90 : 60) + 32} 420 L${(D.has('crate') ? 90 : 60) + 32} 464`, 'none', 'stroke="#7a4a21" stroke-width="2"'))}
      ${S.g(S.r(640, 420, 64, 44, '#a06a35', 'stroke="#7a4a21" stroke-width="2"') + S.p('M640 442 L704 442 M672 420 L672 464', 'none', 'stroke="#7a4a21" stroke-width="2"'))}
      ${S.g(S.e(664, 404, 22, 13, '#f08c2e') + S.c(684, 394, 10, '#f08c2e') + S.p('M676 386 L672 376 L682 382 Z', '#f08c2e') + S.p('M690 384 L696 374 L696 386 Z', '#f08c2e') + S.c(687, 391, 2, '#123') + (D.has('tail') ? '' : S.p('M644 400 Q630 392 634 380', 'none', 'stroke="#f08c2e" stroke-width="5" fill="none" stroke-linecap="round"')))}
      ${S.r(0, 464, 800, 36, '#0e1428')}
      `;
    },
  },

  // --------------------------------------------------------- 6. SPACE STATION
  {
    id: 'space', name: 'Space Station Window', par: 150,
    diffs: [
      { id: 'ring', x: 560, y: 200, r: 46, note: 'the ringed planet lost its ring' },
      { id: 'visor', x: 208, y: 172, r: 18, note: 'the astronaut visor changed colour' },
      { id: 'graph', x: 210, y: 440, r: 22, note: 'a screen graph changed shape' },
      { id: 'leaf', x: 668, y: 428, r: 12, note: 'the space plant lost a leaf' },
      { id: 'cable', x: 420, y: 330, r: 20, note: 'a cable came loose' },
      { id: 'pouch', x: 448, y: 300, r: 18, x2: 478, y2: 300, note: 'the coffee pouch drifted' },
      { id: 'light', x: 736, y: 66, r: 12, note: 'the warning light turned green' },
      { id: 'button', x: 520, y: 448, r: 12, note: 'a console button changed colour' },
    ],
    draw(D) {
      const stars = [[90, 90], [150, 140], [300, 70], [380, 110], [480, 80], [640, 110], [720, 180], [110, 240], [250, 260], [700, 280], [420, 200], [180, 330]].map(([x, y], i) => S.c(x, y, i % 3 === 0 ? 2.6 : 1.8, '#ffffff')).join('');
      const graph = D.has('graph')
        ? S.p('M170 452 L190 430 L210 446 L230 424 L250 440', 'none', 'stroke="#7be0c3" stroke-width="3" fill="none"')
        : S.p('M170 440 L190 448 L210 432 L230 450 L250 428', 'none', 'stroke="#7be0c3" stroke-width="3" fill="none"');
      return `
      ${S.r(0, 0, 800, 500, '#0a0f1e')}
      ${S.g(S.r(60, 40, 680, 360, '#05070f') + stars +
        S.c(560, 200, 46, '#e2a63d') + S.e(560, 196, 26, 12, '#c98a3b') +
        (D.has('ring') ? '' : S.e(560, 200, 78, 18, 'none', 'stroke="#f2c14e" stroke-width="7" fill="none"')) +
        S.c(430, 140, 16, '#7b8bb0') + S.c(660, 300, 10, '#9aa9c7'))}
      ${S.g(S.r(60, 40, 680, 360, 'none', 'stroke="#3a4a6b" stroke-width="14" fill="none"') + S.r(394, 40, 12, 360, '#3a4a6b') + S.r(60, 214, 680, 12, '#3a4a6b'))}
      ${S.g(S.p('M250 240 Q300 300 260 340', 'none', 'stroke="#5a6b8c" stroke-width="3" fill="none"') +
        S.e(208, 186, 26, 32, '#f3ede0') + S.c(208, 148, 22, '#f3ede0') + S.e(208, 142, 15, 10, D.has('visor') ? '#ffd93b' : '#7fd4ff') +
        S.r(178, 200, 10, 26, '#f3ede0', 'rx="5"') + S.r(228, 200, 10, 26, '#f3ede0', 'rx="5"') +
        S.r(196, 214, 8, 22, '#f3ede0', 'rx="4"') + S.r(212, 214, 8, 22, '#f3ede0', 'rx="4"') +
        S.r(200, 178, 16, 10, '#3d7dd9'))}
      ${D.has('cable') ? '' : S.p('M380 380 Q420 330 460 380', 'none', 'stroke="#e2a63d" stroke-width="4" fill="none"')}
      ${S.g(S.r(D.has('pouch') ? 478 : 448, 288, 26, 24, '#c9d6e8', 'rx="4"') + S.r(D.has('pouch') ? 484 : 454, 280, 14, 8, '#8a93a6') + S.t(D.has('pouch') ? 491 : 461, 304, '☕', 12, '#5a4632'))}
      ${S.g(S.r(0, 400, 800, 100, '#1c2947') + S.r(0, 400, 800, 6, '#2a3a5f') +
        S.r(150, 420, 120, 52, '#0e1526', 'stroke="#2a3a5f" stroke-width="2"') + graph +
        S.r(300, 420, 120, 52, '#0e1526', 'stroke="#2a3a5f" stroke-width="2"') + S.p('M310 458 L340 438 L370 452 L400 432', 'none', 'stroke="#ff8c42" stroke-width="3" fill="none"') +
        S.c(480, 436, 9, '#34d399') + S.c(500, 458, 9, '#ffd93b') + S.c(D.has('button') ? 520 : 520, 448, 9, D.has('button') ? '#3d7dd9' : '#e23b3b') + S.c(540, 436, 9, '#7b61ff') + S.c(520, 466, 9, '#7be0c3') +
        S.c(620, 446, 22, '#e23b3b', 'stroke="#7a2a2a" stroke-width="3"'))}
      ${S.g(S.r(650, 440, 30, 22, '#c96a3b', 'rx="3"') + S.p('M656 440 Q650 420 660 410 M666 440 Q668 418 680 408', 'none', 'stroke="#3f8f3a" stroke-width="4" fill="none" stroke-linecap="round"') + (D.has('leaf') ? '' : S.e(668, 428, 7, 4, '#4da66b')) + S.e(660, 414, 6, 4, '#4da66b'))}
      ${S.c(736, 66, 10, D.has('light') ? '#34d399' : '#e23b3b')}${S.c(736, 66, 16, D.has('light') ? 'rgba(52,211,153,0.3)' : 'rgba(226,59,59,0.3)')}
      `;
    },
  },

  // ------------------------------------------------------------- 7. CORAL REEF
  {
    id: 'reef', name: 'Coral Reef Dive', par: 150,
    diffs: [
      { id: 'turtle', x: 512, y: 296, r: 30, x2: 552, y2: 296, note: 'the turtle swam aside' },
      { id: 'starfish', x: 200, y: 452, r: 18, note: 'a starfish is missing' },
      { id: 'bubbles', x: 600, y: 200, r: 20, note: 'extra bubbles rose up' },
      { id: 'shell', x: 330, y: 462, r: 14, note: 'a shell changed colour' },
      { id: 'seahorse', x: 380, y: 300, r: 22, note: 'the seahorse turned around' },
      { id: 'gold', x: 566, y: 438, r: 20, note: 'the treasure gold is gone' },
      { id: 'fishcolor', x: 250, y: 180, r: 18, note: 'a fish changed colour' },
      { id: 'coral', x: 668, y: 380, r: 22, note: 'a coral branch broke off' },
    ],
    draw(D) {
      const coral = (x, y, s, col) => S.g(
        S.p(`M${x} ${y} Q${x - 8 * s} ${y - 30 * s} ${x - 2 * s} ${y - 52 * s}`, 'none', `stroke="${col}" stroke-width="${7 * s}" fill="none" stroke-linecap="round"`) +
        S.p(`M${x} ${y} Q${x + 10 * s} ${y - 26 * s} ${x + 6 * s} ${y - 44 * s}`, 'none', `stroke="${col}" stroke-width="${6 * s}" fill="none" stroke-linecap="round"`) +
        S.c(x - 2 * s, y - 52 * s, 6 * s, col) + S.c(x + 6 * s, y - 44 * s, 5 * s, col));
      const turtleX = D.has('turtle') ? 552 : 512;
      return `
      <defs><linearGradient id="reefWater" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2a9db0"/><stop offset="1" stop-color="#0e4a5e"/>
      </linearGradient></defs>
      ${S.r(0, 0, 800, 500, 'url(#reefWater)')}
      ${S.p('M120 0 L200 0 L120 420 L60 420 Z', 'rgba(255,255,255,0.10)')}${S.p('M420 0 L480 0 L380 420 L320 420 Z', 'rgba(255,255,255,0.08)')}
      ${S.r(0, 420, 800, 80, '#e8d9a8')}
      ${S.p('M60 420 Q80 360 70 320 M90 420 Q110 370 100 330', 'none', 'stroke="#3f8f3a" stroke-width="6" fill="none" stroke-linecap="round"')}
      ${S.p('M720 420 Q700 360 712 316 M690 420 Q672 372 682 336', 'none', 'stroke="#2e6b34" stroke-width="6" fill="none" stroke-linecap="round"')}
      ${coral(110, 430, 1.1, '#ff7ab0')}${coral(300, 436, 0.9, '#ff8c42')}${coral(668, 432, 1, '#ff7ab0')}
      ${D.has('coral') ? '' : coral(700, 436, 0.7, '#ff8c42')}
      ${fish(250, 180, 1, D.has('fishcolor') ? '#7b61ff' : '#ffd93b')}
      ${fish(150, 260, 0.8, '#ff9db0', true)}${fish(640, 150, 0.9, '#7be0c3')}${fish(430, 120, 0.7, '#ff8c42', true)}
      ${S.g(S.e(turtleX, 296, 34, 22, '#4da66b') + S.c(turtleX + 36, 290, 12, '#4da66b') + S.c(turtleX + 42, 286, 2.4, '#123') + S.e(turtleX, 296, 22, 14, '#7bc47f') + S.p(`M${turtleX - 30} 296 L${turtleX - 48} 284 L${turtleX - 48} 308 Z`, '#4da66b') + S.e(turtleX - 8, 312, 10, 5, '#4da66b') + S.e(turtleX + 12, 312, 10, 5, '#4da66b'))}
      ${S.g(S.p('M380 322 Q368 300 380 282 Q392 300 380 322 Z', '#e2a63d', 'stroke="#c98a3b" stroke-width="2"') + S.c(380, 276, 8, '#e2a63d') + S.p('M380 268 L392 260', 'none', 'stroke="#c98a3b" stroke-width="2"'), D.has('seahorse') ? 'transform="translate(760 0) scale(-1 1)"' : '')}
      ${D.has('starfish') ? '' : star4(200, 452, 16, '#ff8c42')}
      ${S.g(S.c(600, 240, 6, '#ffffff88') + S.c(616, 210, 8, '#ffffff88') + S.c(596, 180, 5, '#ffffff88') + (D.has('bubbles') ? S.c(600, 200, 7, '#ffffff99') + S.c(618, 168, 6, '#ffffff99') + S.c(584, 150, 5, '#ffffff99') : ''))}
      ${S.g(S.r(540, 430, 56, 30, '#8a5a2e') + S.p('M540 430 L596 430 L588 418 L548 418 Z', '#a06a35') + (D.has('gold') ? '' : S.c(556, 414, 6, '#ffd93b') + S.c(570, 410, 6, '#ffd93b') + S.c(584, 414, 6, '#ffd93b') + S.c(562, 406, 5, '#f2b705') + S.c(578, 404, 5, '#f2b705')))}
      ${S.e(330, 462, 12, 8, D.has('shell') ? '#7b61ff' : '#ff9db0')}${S.e(120, 470, 10, 7, '#ffffff')}${S.e(740, 468, 11, 7, '#ffd93b')}
      `;
    },
  },

  // ------------------------------------------------------------- 8. CANDY SHOP
  {
    id: 'candy', name: 'Candy Shop', par: 150,
    diffs: [
      { id: 'lolly', x: 250, y: 300, r: 18, note: 'a lollipop changed colour' },
      { id: 'cherry', x: 420, y: 330, r: 12, note: 'a cupcake lost its cherry' },
      { id: 'gumball', x: 690, y: 330, r: 14, note: 'a gumball changed colour' },
      { id: 'sign', x: 400, y: 66, r: 34, note: 'the shop sign lost a letter' },
      { id: 'balloon', x: 120, y: 120, r: 22, note: 'an extra balloon floated in' },
      { id: 'donut', x: 560, y: 396, r: 18, note: 'a donut lost its sprinkles' },
      { id: 'cane', x: 730, y: 200, r: 16, note: 'a candy cane changed stripes' },
      { id: 'jar', x: 590, y: 160, r: 20, note: 'a candy jar is suddenly empty' },
    ],
    draw(D) {
      const jar = (x, y, col, empty) => S.g(
        S.r(x, y, 44, 56, '#ffffffcc', 'stroke="#9aa9c7" stroke-width="2"') +
        (empty ? '' : S.c(x + 12, y + 40, 7, col) + S.c(x + 26, y + 32, 7, col) + S.c(x + 34, y + 44, 6, col) + S.c(x + 18, y + 48, 6, col)) +
        S.r(x - 2, y - 6, 48, 8, '#c98a3b'));
      const lolly = (x, y, col) => S.g(S.r(x - 2, y, 4, 56, '#ffffff') + S.c(x, y - 14, 16, col) + S.c(x - 5, y - 19, 4, '#ffffff99'));
      const cupcake = (x, y, wrap, cherry) => S.g(
        S.p(`M${x - 16} ${y} L${x + 16} ${y} L${x + 11} ${y + 24} L${x - 11} ${y + 24} Z`, wrap) +
        S.c(x, y - 4, 15, '#fff3f6') + (cherry ? S.c(x, y - 18, 6, '#e23b3b') + S.r(x + 1, y - 26, 2, 8, '#3f8f3a') : ''));
      return `
      ${S.r(0, 0, 800, 500, '#ffe9f2')}
      ${S.r(0, 420, 800, 80, '#f7c9d9')}
      ${S.g(S.r(330, 40, 140, 52, '#fff3f6', 'stroke="#e2574c" stroke-width="3"') + S.t(400, 76, D.has('sign') ? 'SWEET' : 'SWEETS', 30, '#e2574c'))}
      ${D.has('balloon') ? S.g(S.e(120, 120, 20, 25, '#7b61ff') + S.p('M120 145 Q116 180 124 210', 'none', 'stroke="#7b61ff" stroke-width="2" fill="none"')) : ''}
      ${S.g(S.e(700, 90, 20, 25, '#ff5c8a') + S.p('M700 115 Q696 150 704 180', 'none', 'stroke="#ff5c8a" stroke-width="2" fill="none"'))}
      ${S.g(S.r(60, 120, 680, 10, '#c98a3b') + jar(120, 130, '#ff5c8a', false) + jar(200, 130, '#3d7dd9', false) + jar(280, 130, '#e2a63d', false) + jar(360, 130, '#4da66b', false) + jar(440, 130, '#7b61ff', false) + jar(520, 130, '#ff8c42', false) + jar(590, 130, '#ff5c8a', D.has('jar')))}
      ${S.g(S.r(60, 240, 680, 10, '#c98a3b') + lolly(150, 268, '#ff5c8a') + lolly(250, 268, D.has('lolly') ? '#3d7dd9' : '#e2a63d') + lolly(350, 268, '#4da66b') + S.p('M430 250 Q430 210 458 214', 'none', 'stroke="#e23b3b" stroke-width="9" fill="none" stroke-linecap="round"') + S.p('M458 214 Q486 218 486 250', 'none', 'stroke="#ffffff" stroke-width="9" fill="none" stroke-linecap="round"') + S.p('M540 250 Q540 210 568 214', 'none', 'stroke="#3d7dd9" stroke-width="9" fill="none" stroke-linecap="round"') + S.p('M568 214 Q596 218 596 250', 'none', 'stroke="#ffffff" stroke-width="9" fill="none" stroke-linecap="round"') + S.p('M660 250 Q660 210 688 214', 'none', 'stroke="#4da66b" stroke-width="9" fill="none" stroke-linecap="round"') + S.p('M688 214 Q716 218 716 250', 'none', 'stroke="#ffffff" stroke-width="9" fill="none" stroke-linecap="round"') + S.p('M730 200 Q730 176 748 178', 'none', `stroke="${D.has('cane') ? '#3d7dd9' : '#e23b3b'}" stroke-width="9" fill="none" stroke-linecap="round"`))}
      ${S.g(S.r(60, 380, 680, 16, '#a06a35') + S.r(80, 396, 12, 60, '#7a4a21') + S.r(708, 396, 12, 60, '#7a4a21'))}
      ${cupcake(180, 330, '#7b61ff', true)}${cupcake(300, 330, '#3d7dd9', true)}${cupcake(420, 330, '#e2574c', !D.has('cherry'))}
      ${S.g(S.c(560, 396, 20, '#ffb3c8') + S.c(560, 396, 11, '#fff3f6') + (D.has('donut') ? '' : S.c(546, 386, 2.5, '#e23b3b') + S.c(574, 388, 2.5, '#3d7dd9') + S.c(560, 410, 2.5, '#4da66b') + S.c(548, 404, 2.5, '#e2a63d') + S.c(572, 404, 2.5, '#7b61ff')))}
      ${S.g(S.r(676, 356, 28, 60, '#c98a3b') + S.c(690, 330, 26, '#cfe8ff', 'stroke="#9aa9c7" stroke-width="3"') + S.c(682, 322, 5, '#e23b3b') + S.c(696, 334, 5, D.has('gumball') ? '#3d7dd9' : '#4da66b') + S.c(690, 344, 5, '#e2a63d') + S.c(700, 320, 4, '#ff5c8a') + S.r(684, 356, 12, 8, '#7a4a21'))}
      ${S.g(S.c(120, 452, 8, '#ff5c8a') + S.c(140, 460, 7, '#3d7dd9') + S.c(160, 452, 8, '#e2a63d') + S.c(180, 460, 7, '#4da66b'))}
      `;
    },
  },
];
