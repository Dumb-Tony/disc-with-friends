# Sunny Pines · Nature mode

Nine holes, par 34. Four par 3s, three par 4s and two par 5s. Distances are straight tee-to-basket distances; mown routes can be longer. The first few holes introduce narrow gates, stream carries and pond decisions. Later holes combine placement drives, guarded approaches and multiple hazards. Open space permits alternate lines and overhand experimentation.

| Hole | Name | Par | Distance | Main decision |
| --- | --- | --- | --- | --- |
| 1 | Pine Gate | 3 | 55 m | Thread the pines or use the wide flank |
| 2 | Willow Brook | 3 | 64 m | Clear the brook or go around its end |
| 3 | Mirror Pond | 4 | 83 m | Carry the pond or place a drive on its bank |
| 4 | Cedar Bend | 4 | 105 m | Shape around a wooded bend |
| 5 | Needle Alley | 3 | 70 m | Two offset gaps reward careful placement |
| 6 | Twin Crossings | 5 | 124 m | Plan two stream carries |
| 7 | Stone Pocket | 3 | 63 m | Clear the rocks without overshooting into water |
| 8 | Lakeside Reach | 4 | 137 m | Follow the long bank or attempt a lake carry |
| 9 | Homeward Waters | 5 | 166 m | Pond, stream and a final pine gate |

## Round rules

Each release counts one stroke. A water landing adds one penalty stroke and automatically moves the lie to that hazard's marked drop zone. Airborne discs can cross water. Drop zones have a pale ring and small post. Trees and rocks deflect shots; there are no invisible out-of-bounds walls. Non-scoring dry landings become the next lie immediately. Basket scoring still requires chains followed by a retained tray landing.

Use Next hole or Enter after holing out. S opens the nine-hole scorecard, including penalties. The ninth basket shows the round total against par. R/Home restarts only the current hole and retains previous results. Space replaces the previous shot with its identical replay, restoring its original stroke/penalty totals first; repeated water replays cannot accumulate extra penalties.

The menu offers a fresh nature round or individual-hole practice. Practice starts a separate scorecard. Settled lies, scores and progress save in this browser; refresh and Resume returns to the last checkpoint. A throw in progress is not a saved checkpoint. Tuning remains available and uses its separate existing save. Playground mode is a future course family, not yet playable.

## Authoring and verification

src/course.js is the shared source of hole names, pars, pins, suggested routes, tree dimensions, water ellipses/drop zones and rocks. Course rendering, minimap and simulation consume the same geometry. src/environment.js resolves swept water and rock contact. src/round.js owns progression and validated saved-round data independently of rendering. FieldView.loadHole replaces hole objects and disposes their resources.

tests/fixtures/nature-round.json contains full legal-input routes from each tee through every intermediate lie to a scored basket. npm test replays them with physics. scripts/nature-browser.mjs plays the same complete nine-hole round using native mouse movement, draw/release and next-hole input, then verifies scorecard persistence, practice selection, water penalties, exact replay and hole restart. TEST_URL can target the public build. These automated routes verify reachability and flow; human playtesting remains the judge of difficulty and fun.
