# Architecture and tuning

- `src/config.js`: default SI-unit flight constants, legal tuning ranges, basket and 120 Hz fixed step.
- `src/physics.js`: engine-independent mutable shot state; `launch`, fixed `step`, headless `simulate`. No DOM, Three.js, clock or random calls. Wind is uniform, ground is flat. Extend environment queries here when obstacles become in scope.
- `src/input.js`: direction/bank/draw state machine, independent of the DOM. Positive screen-right aim maps to negative world yaw because the range runs along +Z. Positive bank means anhyzer. Wind X is screen-right from the tee; Z is tailwind.
- `src/view.js`: Three.js scene, disc transform, recorded trail, shadows, camera and simple basket animation. Visuals cannot feed forces back into the simulation.
- `src/main.js`: event wiring, accumulator, shot/lie lifecycle, HUD and saved tuning. Coefficients are copied at launch so adjusting a slider never silently changes a disc already in flight. Space replays original coefficients; R sets up a fresh throw using current settings.
- `src/audio.js`: small gesture-activated Web Audio cues, no downloaded assets.

The simulation integrates semi-implicitly at 1/120 s. Render frames contribute time to an accumulator. Long visible stalls are capped at 100 ms; hidden tabs pause. This preserves shot paths at the cost of slower wall-clock playback during severe stalls. No promise of bit-identical floating point across all browser engines, but a single browser produces identical shot states.

Lift uses squared relative horizontal airspeed, capped for arcade stability. Drag opposes relative air velocity. Lift is banked into vertical and lateral components. High-speed turn and low-speed fade change bank, resisted by automatic spin. Spin decays exponentially. Ground contacts choose bounce, slide or edge roll; friction brings them to rest. Swept basket proximity prevents chain tunnelling; gentle chain hits catch, fast ones reject. These are deliberately simplified contact rules, not rigid-body chain simulation.

## Fast tuning loop

1. Press T and adjust a coefficient. Values persist locally, with validation against allowed ranges.
2. Close panel, R, then throw. Coefficients are frozen for that shot.
3. Use Space to check repeatability of the exact last shot.
4. Change one value at a time and re-throw with a similar gesture. Export the shot and tuning when reporting feedback.
5. Restore defaults to return to the committed baseline.

Gravity and the selected pitch set the vertical envelope. `launchLoft` now sets the starting pitch on startup, Home and next lie; explicit shot pitch overrides it. Legacy shots without pitch retain their old launchLoft behavior. Lift controls glide; drag governs speed loss. Turn changes the fast phase, fade the slowing phase. Spin decay controls stability loss. Skip and friction shape landings. Max speed and the power exponent inside `launch` shape the useful draw range. Input sensitivities, 240 px draw and the snap threshold live in `input.js`.

The input model has no time-based accuracy factor. Moving forward during the draw reduces power. Horizontal aim, pitch and bank cannot change until the draw ends or is cancelled. Mouse up increases pitch; holding RMB edits bank alone. Pitch is stored in radians in each shot/export/replay and clamped to -20°…55°. Focus loss, pointer-lock loss and panel opening cancel the draw to avoid accidental releases.

## Deployment

Vendored Three.js 0.180.0 (MIT license included). No build step required for browser assets. GitHub Actions tests then uploads an explicit `site` directory containing only index, CSS, src and vendor. Private conversation, node_modules, tests and diagnostic screenshots never enter the deployed site. Repository-relative imports support GitHub Pages project URLs.

## Visual pass 0.2

`src/visuals.js` owns procedural materials, molded disc geometry and stamp, linked-chain basket, turf and pine instancing, sky/reflection lighting and soft contact shadow. Textures are generated locally from fixed seeds; no remote art dependencies. Decoration has no collision or flight authority. Chain response remains visual, driven by the existing catch event. Grass and foliage use instancing to limit draw calls. The moving sunlight shadow region follows the disc; only rendering is affected.

Run `node scripts/visual-review.mjs` against the local server (or set TEST_URL) to capture isolated disc/basket close-ups and report shader console errors and rendering counts. Its temporary inspection page is intercepted only by the test browser and is not shipped as a game mode.
