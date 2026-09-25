# Design contract

## North star

Simple controls + deep mastery + increasingly absurd playgrounds. Believable arcade disc flight, inspired by disc golf and Golf With Your Friends. Mastery comes from shaping shots and discovering routes, not extra controls or hidden randomness.

## Locked first milestone

Mechanics sandbox only: one disc, one field and one basket. Prove the repeated loop Aim → Angle → Draw → Release → Flight → Land → Throw again before spending substantial effort on levels, characters or art.

Mouse left/right aims horizontally; mouse up/down sets launch elevation from -20° to +55°. This vertical-aim addition was requested after the first playtest and supersedes automatic launch elevation. Holding RMB and moving horizontally sets bank from -45° hyzer to +45° anhyzer; release retains the angle. A useful flat snap makes neutral effortless. Holding LMB locks aim and bank, then downward mouse travel draws power like a bow. Release throws. This is displacement, never a hold timer. Cancel with RMB/Esc. No swing timing meter, accuracy RNG, grip, nose-angle control, spin control or simulator inputs. Spin and launch speed derive automatically from the shot. Pitch is the vertical component of direction, not a separate aerodynamic nose-angle control.

The direction arrow only shows the launch line. No predicted landing path: players learn the flight. The trail records flight already travelled. Power is a physical draw and small bar, not an accuracy minigame. Visible disc pullback and tilt, responsive release, sound and legible camera transitions matter more than decorative polish.

## Flight expectations

Use actual evolving velocity and forces, not a predefined spline. Gravity, lift, drag, high-speed turn, late fade, automatic spin, ground skips/rolling and wind must interact deterministically. Same position + direction + angle + power + tuning + wind should reproduce the same outcome. Coefficients serve game feel rather than laboratory accuracy.

Right-handed backhand convention: hyzer curves left; anhyzer starts right and can fight back as fade develops. A hard flat throw holds a long initial line and fades late. Gentle throws should remain controllable. The current model is a tunable first baseline: anhyzer flex strength, wind response, putting range, friction and camera comfort still need human feel feedback.

## Staged development

1. The Field: throwing alone must be satisfying. Iterate using live tuning and exact replay. No milestone advancement based only on passing tests.
2. Prove ordinary disc golf with roughly 3–6 simple holes (Sunny Pines): hills, trees, rocks, a pond. Can distance and angle judgement stay fun for twenty holes?
3. Whimsical putt-putt playgrounds built for fully 3D disc routes: windmills with gaps, ponds with skip opportunities, fountain jets, fans and air currents, pipes, moving obstacles, conveyors, portals, bumpers, cannons, trampolines, geysers, drawbridges, swinging hammers and moving baskets.

Obstacles create opportunities, not only punishment. Aim for a safe route, risky shortcut and ridiculous high-skill ace route. Players may go over, under, around, through, skip, curve or ride wind. Avoid invisible corridors that prevent experimentation. Wind and obstacle effects must be readable, repeatable and learnable. Portals should preserve momentum; conveyors carry grounded discs; water jets redirect flight; fans offer alternate routes.

## Preserved longer-term ideas (not current commitments)

- Throw from the actual lie, including roofs or moving objects, with relief only for impossible positions.
- Small disc bag with meaningful sidegrades, cosmetic wear and personal attachment; cosmetics/characters confer no stats. Starter gear should remain useful.
- Friendly exaggerated characters and expressive reactions. Basket audio and chain motion should make a catch immediately satisfying.
- Solo mastery, medals, trick-shot targets, hidden challenges, ghosts and personal bests; not multiplayer leftovers.
- Eventually 1–8 players, classic scoring, party modifiers and optional disc collisions. Turn-based or simultaneous modes are future decisions.
- Possible worlds: Sunny Pines, Pirate Cove, Giant's Garden, OSHA Nightmare, Frostbite Peak, Wizard Academy, Lunar Links. Increasingly impossible routes, not arbitrary difficulty.
- Modifiers/sidegrades: giant discs, tiny baskets, low gravity, hurricane wind, bouncy terrain, brick/paper plate/boomerang/rubber discs. Reserve outrageous equipment for appropriate modes.
- No RPG stat grind, energy systems, crafting, equipment levels or hundreds of near-identical discs.

## Superseded proposals

Earlier discussion entertained Unity, timing mechanics, explicit nose angle, multiple discs and a broader first level. The final decision is HTML + JavaScript + WebGL first, with only direction/bank/power, one disc and an empty practice field. Unity is a possible later migration if project scale warrants it; clean simulation boundaries preserve that option. Historical brainstorming is archived locally for continuity, not treated as current scope.


## Basket acceptance update

Basket metal must be physical: lower and upper tray rims, wire tray, pole and top band can reject a shot. Scoring requires a real chain strike followed by the disc remaining in the tray, rather than entering a broad invisible catch volume. Chains should respond locally to impact direction and strength, then settle with damping. Full articulated-chain contact physics remains beyond this sandbox; a deterministic contact approximation and responsive strand animation are appropriate here.


## First playable hole (user-approved scope)
Pine Gate is now hole 01, a 55 m par 3. A narrow central pine gate offers a direct aggressive line; a broad mown left flank offers a safe two-shot approach. Nine authored trees use shared visible/collision dimensions; trunks deflect and foliage absorbs speed. No water penalty or elaborate course content in this first hole. Missed shots automatically advance to their settled lie, face the basket and reset bank. Only holing out shows a completion panel. R/Home restart the hole; Space remains an exact shot replay for testing.
