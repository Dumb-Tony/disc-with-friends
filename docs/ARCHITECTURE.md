# Architecture and tuning

- `src/config.js`: default SI-unit flight constants, legal tuning ranges, basket and 120 Hz fixed step.
- `src/physics.js`: engine-independent mutable shot state; `launch`, fixed `step`, headless `simulate`. No DOM, Three.js, clock or random calls. Wind is uniform, ground is flat. Extend environment queries here when obstacles become in scope.
- `src/input.js`: direction/bank/draw state machine, independent of the DOM. Positive screen-right aim maps to negative world yaw because the range runs along +Z. Positive bank means anhyzer. Wind X is screen-right from the tee; Z is tailwind.
- `src/view.js`: Three.js scene, disc transform, recorded trail, shadows, camera and simple basket animation. Visuals cannot feed forces back into the simulation.
- `src/main.js`: event wiring, accumulator, shot/lie lifecycle, HUD and saved tuning. Coefficients are copied at launch so adjusting a slider never silently changes a disc already in flight. Space replays original coefficients; R restarts the hole using current settings.
- `src/audio.js`: small gesture-activated Web Audio cues, no downloaded assets.

The simulation integrates semi-implicitly at 1/120 s. Render frames contribute time to an accumulator. Long visible stalls are capped at 100 ms; hidden tabs pause. This preserves shot paths at the cost of slower wall-clock playback during severe stalls. No promise of bit-identical floating point across all browser engines, but a single browser produces identical shot states.

Lift uses squared relative horizontal airspeed, capped for arcade stability. Drag opposes relative air velocity. Lift is banked into vertical and lateral components. High-speed turn and low-speed fade change bank, resisted by automatic spin. Spin decays exponentially. Ground contacts choose bounce, slide or edge roll; friction brings them to rest. Basket contact now lives in `basket-collision.js`; it sweeps a thin oriented ellipsoid along each physics tick with samples smaller than disc thickness. Metal wires, rim rings, post and top band deflect according to their contact normal. Nominal chain strand contacts absorb speed based on impact offset and speed. A score requires a prior chain touch and a retained tray landing, so the disc falls instead of teleporting into the basket.

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

`src/visuals.js` owns procedural materials, molded disc geometry and stamp, linked-chain basket, turf and pine instancing, sky/reflection lighting and soft contact shadow. Textures are generated locally from fixed seeds; no remote art dependencies. Decoration has no collision or flight authority. Chain flex remains visual, driven by the collision impact position and incoming velocity. Grass and foliage use instancing to limit draw calls. The moving sunlight shadow region follows the disc; only rendering is affected.

Run `node scripts/visual-review.mjs` against the local server (or set TEST_URL) to capture isolated disc/basket close-ups and report shader console errors and rendering counts. Its temporary inspection page is intercepted only by the test browser and is not shipped as a game mode.


## Basket contacts and chain response

- 'basket-shape.js' defines basket dimensions, metal wire segments and nominal chain attachment positions. The visible disc radius and its contact radius are both 0.24 m, allowing it to fit between the pole and rim.
- 'basket-collision.js' resolves the first swept contact in each tick. Metal takes priority over chains at overlapping boundaries. Side, low and high metal hits bounce; grazing contacts deflect along the contact normal. Top-band cap is solid. A chain hit emits impact position/velocity, damps motion and starts a short contact cooldown. Off-center hits can escape; centered firm throws are cushioned.
- Scoring happens on downward, slow tray contact inside the basket, only after the shot has touched a chain. A direct tray landing without a chain hit is retained but unscored, as requested. The flexible bottom chain loop is not a rigid metal collider.
- 'chain-motion.js' simulates attached, slightly slack Verlet strands at 120 Hz with distance constraints, restoring forces and damping. The impacted links and nearby strands receive the impulse. The renderer orients each instanced link along its deformed strand. The nominal chain collider does not follow visual deformation; replay outcomes remain independent of rendering frame rate.
- Contacts are deterministic arcade approximations, not a full flexible-body or disc rigid-body solver. Tune metal restitution and chain speed retention in 'basket-collision.js' / 'basket-shape.js'; tune slack, damping and response in 'chain-motion.js'.

'node scripts/basket-browser.mjs' renders controlled collision fixtures through the real physics and renderer, capturing a chain hit, later tray catch and lower-ring ricochet. These are automated diagnostic replays; the regular browser test also completes a mouse-driven scoring shot from the tee.


Chain catch feel: central strikes engage several strands and retain forward motion capped at 3.5 m/s, letting the disc enter the curtain. A pole contact within 0.65 seconds of a chain strike, above the lower chain attachment, absorbs normal velocity instead of rebounding; exposed pole and rim contacts remain rigid. Edge clips retain more momentum and can miss. Scoring still waits for a retained tray landing. These are deterministic feel coefficients in src/basket-collision.js, not a full flexible-body simulation.


Course data lives in src/course.js, shared by course-view.js and course-collision.js. Main passes the tree list into the pure fixed-step simulation; isolated physics/basket tests can omit obstacles. Swept contacts distinguish hard trunks from yielding foliage, once per canopy entry. The completedShot diagnostic retains the last landing after automatic lie advancement. Hole restart clears score and replay history.


The shared maxBank constant in config.js permits ±90° releases in input, the HUD and flight. Vertical releases have near-zero upward lift and strong lateral lift, then can roll when they hit the ground. Airborne overhand orientation now continues through inversion using the tunable response in overhand.js; see FLIGHT-REFERENCES.md for references and limits. Pitch still chooses the upward launch direction independently.


## Nature course / round lifecycle
Main now passes the active hole (pin plus environment) to the isolated simulation. Legacy tree-array arguments remain supported for mechanic fixtures. course.js is shared by rendering, collisions and the minimap. environment.js sweeps for water and ellipsoid rock contacts. round.js owns the nine scores, stroke/penalty counts, progression and validated local saves. Replays restore pre-shot counts before applying their results. Saved rounds checkpoint only settled shots and transitions. Dynamic scene objects are disposed on hole changes; grass instances are hidden inside water. See NATURE-COURSE.md for round controls and full-route regressions.


## Woodland rendering and disc profiles
surfaces.js creates seeded foliage, stone, shore and water-normal textures. woodland.js adds instanced broadleaf trees, shrubs/flowers and soft transparent sun shafts outside the authored fairways. It reloads behind the active green, using the existing dynamic resource disposal. Sun shafts are artistic transparent volumes; reflections use the existing environment map. No path tracer or hardware ray tracing is present.

discs.js contains three renderer-independent profiles. discConfig copies base tuning and applies profile multipliers at release. Driver glide/fade also respond to throw power. main.js freezes the resulting coefficients and disc ID in lastShot, so changing selection or base tuning cannot change an airborne disc or its replay. Midrange preserves all original coefficients and course fixtures. New profiles use the same collision size. Selection locks during draw and flight, persists separately, and works via 1/2/3 or buttons.


Water now uses shared sampled shorelines: irregular pond contours and continuous winding creeks. Rendering, minimap, hazards and grass masking consume the same boundary from water-shape.js. Banks include reeds and varied-width earthy edging. Grass density is increased to 70,000 instanced clumps, with taller rough; broadleaf crowns and course pines have individual alpha-cut leaf sprays. Decorative foliage remains separate from deterministic flight.

For Windows browser checks, ANGLE_BACKEND=d3d11 uses the native GPU; the default remains SwiftShader for software-rendered regressions. BROWSER_EXECUTABLE selects an installed browser. scripts/shoreline-review.mjs captures oblique pond, creek and foliage views and checks renderer errors.
