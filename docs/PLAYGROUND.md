# Cloud Carnival — Playground mode

Nine holes, par 33. Choose Cloud Carnival in the menu; Sunny Pines remains the nature course. Each course saves its own round, including practice and completed scorecards. Restart affects the current hole, and New round affects only the selected course.

Share directly: https://dumb-tony.github.io/disc-with-friends/?course=cloud-carnival-v1

## Art direction

Chunky original toy scenery, mint lanes, candy stripes, pastel cloud banks, bright toon shading and real-time shadows. Readable shapes take priority over woodland texture detail. Scenery frames a broad playable lawn: the painted lane is a suggested route, not an invisible corridor or out-of-bounds penalty. This is a solo first course, not multiplayer.

## Nine holes

| Hole | Name                  | Par | Main idea                                    |
| ---- | --------------------- | --- | -------------------------------------------- |
| 1    | Welcome to the Bounce | 3   | Spring bumper introduction                   |
| 2    | Windmill Wishes       | 3   | Rotating sail shortcut, open flanks          |
| 3    | Air Mail              | 3   | Readable crosswind and tailwind lane         |
| 4    | Pocket Universe       | 4   | Momentum-preserving portal shortcut          |
| 5    | Pop Goes the Disc     | 3   | Ground trampoline and candy wall             |
| 6    | Pinball Picnic        | 4   | Bumper banks or outer-lawn placement         |
| 7    | Double Trouble        | 4   | Opposing windmills and a wind-assisted flank |
| 8    | The Long Way Round    | 4   | Portal shortcut or dogleg placement          |
| 9    | Big Top Finale        | 5   | Combined sails, fan, portal and trampoline   |

## Obstacle rules and architecture

- Pink bumpers reflect a disc with a little extra energy and lift.
- Striped walls and windmill sails are solid; the arch frame is solid too. Sails rotate continuously.
- Blue painted fan zones apply the force shown by the arrows, up to seven metres above the lawn. Flying discs alone receive the force.
- Yellow pads launch a low or descending disc upward. A cooldown prevents repeated activation during a single contact.
- Purple portals accept forward travel through the open ring and exit at the blue ring, preserving velocity and relative position. A cooldown prevents accidental loops. They are one-way shortcuts.

Throwing controls and all three disc profiles are shared with Nature. There are no extra timing meters or random accuracy modifiers.

Course data and gadget dimensions are in src/playground.js; pure interactions are in src/playground-physics.js; original procedural artwork is in src/playground-view.js. Course registry and round save validation live in courses.js and round.js. Physics remains fixed at 120 Hz. Shared flight coefficients remain available through Tuning.

The simulation records the course clock at launch. Windmill rendering and collision use the same angle function. Exact replay restores that clock along with the original disc and coefficients, so moving-obstacle replays reproduce their original result. Saved rounds preserve the lie and score; obstacle phase is reset when resuming a round.

## Validation

Run npm test for deterministic interactions, saved-round validation and full nine-hole route fixtures at several sail phases. Browser scripts carnival-browser.mjs, carnival-gadgets.mjs and carnival-review.mjs cover native mouse round completion, replay, deliberate obstacle interactions, all nine views, reload and switching modes. Set TEST_URL to test a deployment. Browser route tests are automated input replays, not a substitute for human feel feedback.
