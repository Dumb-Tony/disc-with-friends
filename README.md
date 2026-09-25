# Disc With Friends — The Field

**[Play in your browser](https://dumb-tony.github.io/disc-with-friends/)** · Desktop and mouse · Mechanics prototype 0.1

One disc, one practice basket, one question: is throwing fun enough to build a game around?

## Controls

| Action | Input |
| --- | --- |
| Aim horizontally and vertically | Move mouse left/right and up/down |
| Set hyzer / flat / anhyzer | Hold right mouse and move sideways; release to keep angle |
| Draw power | Hold left mouse and pull toward you (down); push forward to reduce |
| Throw | Release left mouse |
| Cancel draw | Right mouse or Esc |
| Reset at current lie | R |
| Return to tee | Home |
| Play from landing position | N |
| Repeat identical last shot and coefficients | Space |
| Developer tuning | T |

Click the field to capture the cursor. Esc releases it. Horizontal aim, vertical aim and bank lock during power draw. Pitch ranges from 20° down to 55° up; Home and a new lie start at 10° up. Flat has a small neutral snap. A full draw is 240 CSS mouse pixels; time held does not matter. Tiny clicks do not throw. Losing focus cancels a draw. The UI remains accessible after releasing the cursor.

## Local play

Requires Node 20+. Run `npm start`, then open http://localhost:4173 in Chrome or Edge. Set the `PORT` environment variable if occupied. Runtime assets are checked in; local play needs no installation or CDN. ES modules need an HTTP server, not a file:// launch.

For development: `npm ci`, `npm test`. `npm run vendor` refreshes the pinned Three.js files. `node scripts/browser-test.mjs` exercises Chrome against localhost:43927; set `TEST_URL` for another server. The browser test's executable path is currently Windows Chrome.

## Included

3D practice range; 55 m basket; deterministic 120 Hz aerodynamics; bank, speed-dependent turn/fade and spin decay; skips, slides and edge rolls; fixed wind tuning; swept disc-shaped contacts with both basket rings, tray wires, post and top band; chain damping followed by a physical tray landing; locally flexing chain strands; setup/flight/landing camera; shot counter; exact replay; current-lie practice; persistent tuning; downloadable shot/coefficient report; basic synthesized throw, ground and chain sounds.

This is a first feel-testing build, not a finished physics simulator. Basket metal now deflects the disc. A score requires actual chain contact followed by a retained tray landing; a rim hit alone never scores. The contact model uses a thin oriented disc approximation and static chain strands. The linked-chain animation uses damped constraints, with fixed attachments; it does not feed forces back into flight. Far trees are scenery, not collision obstacles. There is no multiplayer, obstacle course, touch mode or elaborate art. Spin is automatic. Mouse up/down controls launch elevation. The player only chooses direction, angle and power.

See [design](docs/DESIGN.md), [architecture and tuning](docs/ARCHITECTURE.md), and [playtest checklist](docs/PLAYTEST.md).

## Shareable workflow

Push to `main`: GitHub Actions runs mechanics tests, packages only browser assets, then deploys GitHub Pages. The public link above is the preferred playtest entry point. Relative URLs work under the repository subpath. No runtime analytics, external font requests, remote scripts or backend.

The complete source design conversation is preserved in `private/design-conversation.md` locally, ignored by Git. Public design documentation records the accepted decisions and future direction without publishing the conversation itself.
