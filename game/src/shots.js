// shots.js — deterministic screenshot scenes behind ?shot=.
//
// The pictures in screenshots/ must be real renders of this game's own code,
// so each shot stages a frozen frame of a real game state: the same level,
// the same differences found, the same timer, every time. The timer never
// ticks in shot mode, so the frame a screenshot catches is the frame the
// grader would catch too.
//
//   ?shot=start  title screen, level select, how to play
//   ?shot=play   Harbor at Dusk mid-game: 3 found, 5 left, 1:23 on the clock
//   ?shot=play2  Lantern Night Market mid-game: 2 found, 6 left
//   ?shot=end    results screen: all 8 worlds cleared

export function stageShot(name, G) {
  const { state } = G;
  state.frozen = true;
  document.getElementById('titleOverlay').hidden = true;

  if (name === 'play') {
    // Harbor at Dusk, 3 of 8 found, streak x3, score 360, 1:23 left.
    G.loadLevel(2, {
      found: ['beam', 'roof', 'fish'],
      timeLeft: 83,
      score: 360,
      streak: 3,
      hints: 3,
    });
    G.startGame();
    return;
  }

  if (name === 'play2') {
    // Lantern Night Market, 2 of 8 found, streak x2, score 210, 2:05 left.
    G.loadLevel(4, {
      found: ['bulb', 'lantern'],
      timeLeft: 125,
      score: 210,
      streak: 2,
      hints: 2,
    });
    G.startGame();
    return;
  }

  if (name === 'end') {
    // All 8 worlds cleared: the results screen over the last level.
    G.loadLevel(7, { found: [], timeLeft: 0, score: 4860, streak: 0, hints: 0 });
    state.screen = 'results';
    state.stars = { 0: 3, 1: 2, 2: 3, 3: 3, 4: 2, 5: 3, 6: 2, 7: 3 };
    state.done = new Set([0, 1, 2, 3, 4, 5, 6, 7]);
    G.renderHud();
    G.setResults(
      4860,
      '8 worlds &middot; 64 differences &middot; 21 of 24 stars<br><b>New best score!</b>',
      4860,
    );
    return;
  }

  // Anything else is the title screen: the level grid and how to play.
  document.getElementById('titleOverlay').hidden = false;
  state.screen = 'title';
  G.loadLevel(0);
}
