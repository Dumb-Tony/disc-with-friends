# Disc With Friends — Sunny Pines

**[Play in your browser](https://dumb-tony.github.io/disc-with-friends/)** · Desktop and mouse · Nature course playtest

A complete nine-hole nature course, par 34, with pine gates, wooded bends, winding streams, ponds and rock-guarded greens. Land, line up and throw again automatically.

## Controls

| Action | Input |
| --- | --- |
| Aim horizontally and vertically | Move mouse left/right and up/down |
| Set hyzer / flat / anhyzer | Hold right mouse and move sideways up to ±90°; release to keep angle |
| Draw power | Hold left mouse and pull toward you (down); push forward to reduce |
| Throw | Release left mouse |
| Cancel draw | Right mouse or Esc |
| Restart hole | R or Home |
| Play from landing position | Automatic |
| Repeat identical last shot and coefficients | Space |
| Developer tuning | T |
| Scorecard | S |
| Next hole after a catch | Enter or Next hole |

Click the field to capture the cursor. Esc releases it. Horizontal aim, vertical aim and bank lock during power draw. Pitch ranges from 20° down to 55° up; Home and a new lie start at 10° up. Flat has a small neutral snap. A full draw is 240 CSS mouse pixels; time held does not matter. Tiny clicks do not throw. Losing focus cancels a draw. The UI remains accessible after releasing the cursor.

## Local play

Requires Node 20+. Run `npm start`, then open http://localhost:4173 in Chrome or Edge. Set the `PORT` environment variable if occupied. Runtime assets are checked in; local play needs no installation or CDN. ES modules need an HTTP server, not a file:// launch.

For development: `npm ci`, `npm test`. `npm run vendor` refreshes the pinned Three.js files. `node scripts/browser-test.mjs` exercises Chrome against localhost:43928; set `TEST_URL` for another server. The browser test's executable path is currently Windows Chrome.

## Included

Nine nature holes with physical trees, rocks and water hazards; saved round progress, scorecard and practice-hole selection; deterministic 120 Hz aerodynamics; bank, speed-dependent turn/fade and spin decay; skips, slides and edge rolls; fixed wind tuning; swept disc-shaped contacts with both basket rings, tray wires, post and top band; chain damping followed by a physical tray landing; locally flexing chain strands; setup/flight/landing camera; shot counter; exact replay; automatic lie advancement; persistent tuning; downloadable shot/coefficient report; basic synthesized throw, ground and chain sounds.

This is a first feel-testing build, not a finished physics simulator. Basket metal now deflects the disc. A score requires actual chain contact followed by a retained tray landing; a rim hit alone never scores. The contact model uses a thin oriented disc approximation and static chain strands. The linked-chain animation uses damped constraints, with fixed attachments; it does not feed forces back into flight. Far trees are scenery, not collision obstacles. There is no multiplayer or touch mode. Spin is automatic. Mouse up/down controls launch elevation. The player only chooses direction, angle and power.

See [design](docs/DESIGN.md), [architecture and tuning](docs/ARCHITECTURE.md), and [playtest checklist](docs/PLAYTEST.md).

## Shareable workflow

Push to `main`: GitHub Actions runs mechanics tests, packages only browser assets, then deploys GitHub Pages. The public link above is the preferred playtest entry point. Relative URLs work under the repository subpath. No runtime analytics, external font requests, remote scripts or backend.

The complete source design conversation is preserved in `private/design-conversation.md` locally, ignored by Git. Public design documentation records the accepted decisions and future direction without publishing the conversation itself.


Chain catch feel: central strikes engage several strands and retain forward motion capped at 3.5 m/s, letting the disc enter the curtain. A pole contact within 0.65 seconds of a chain strike, above the lower chain attachment, absorbs normal velocity instead of rebounding; exposed pole and rim contacts remain rigid. Edge clips retain more momentum and can miss. Scoring still waits for a retained tray landing. These are deterministic feel coefficients in src/basket-collision.js, not a full flexible-body simulation.


Pine Gate opens Sunny Pines, a nine-hole par-34 nature course. See [course guide](docs/NATURE-COURSE.md). Non-scoring landings automatically advance to the next throw. R or Home restarts the hole; Space replays the previous throw. The completion card appears only on a successful basket.


Near-vertical throws now pan and turn through inversion, with speed/spin-dependent turnover and distinct upside-down slides versus edge rolls. [Video references and modeling limits](docs/FLIGHT-REFERENCES.md).
