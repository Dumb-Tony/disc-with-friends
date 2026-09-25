# Mechanics playtest

This build is ready for feedback, not a declaration that the mechanics feel excellent. Automated browser interaction verifies input and state transitions; visual inspection verifies framing. Neither replaces a person's mouse feel or comfort judgement.

## Quick session

1. Make a small, medium and full flat draw. Do their distances feel connected to your hand? Back the mouse forward before release to reduce power.
2. Repeat at left and right bank angles. Find flat again. Does the neutral snap help without trapping you?
3. During a draw, move sideways deliberately. Direction must stay locked.
4. Try R immediately after launch; throw again. Try Esc/RMB cancellation without an accidental throw.
5. Watch the flight and landing. Can you keep the disc in view and understand where it stopped? Any uncomfortable camera swing?
6. Press Space: identical replay. The next lie is automatic with no prompt. R or Home restarts the hole.
7. Reach the basket from your lie. Check gentle and firm centered catches, and off-center rejections. Try a deliberately steep bank for a roller.
8. Open T, change one coefficient, make a new throw, then restore defaults. Check sidewind/headwind/tailwind.

Report what you expected, what happened, and whether the issue was input, flight, camera or landing. Export shot + tuning for a reproducible physics report. Useful priorities: draw distance sensitivity, low-power precision, visible late fade, anhyzer flex, landing friction, camera speed.

## Automated validation

`npm test`: deterministic sampled states; draw direction and angle lock; reversible power; neutral snap; cancellation; useful distance/angle separation; ground bounds and finite settlement over power/bank/wind combinations; edge rolling; swept basket catch/rejection/miss; 30/60/144 Hz render grouping equivalence.

`node scripts/browser-test.mjs`: Chrome pointer draw/angle gesture, launch, completed landing, identical replay, next lie, tee reset, tuning persistence and page error collection. Captures welcome, flight, landing and setup screenshots locally. This is automated input playback, not manual human playtesting.

## Vertical aiming

Move the mouse up/down before drawing: aim from 20 degrees down to 55 degrees up. Check the elevation readout and launch-direction marker, then deliberately move vertically while holding LMB: only power should change. Holding RMB should affect bank without changing elevation. Try a high lob and a low skip at the same power. R keeps your selected elevation; Home and N return to the configured starting pitch. Replay must reproduce the original elevation. `node scripts/pitch-framing.mjs` captures both limits using real browser mouse input.


## Basket accuracy

Aim low at either tray ring: the disc should ricochet, with metal audio, instead of scoring. Aim at the center pole or top band to check those rejections. Raise the shot into the chains: they should bend near the contact and lose motion naturally as the disc drops. A hard or glancing chain strike can spit out; chain contact alone is not a score. Check the rim with a banked disc as well as a flat one. Repeat with Space to verify the same outcome. The low 211-pixel default tee draw that previously scored now hits metal; a 213-pixel straight draw reaches the chains and is a regression fixture.


Pine Gate route checks: from default tee, aim 0.3 radians toward the open flank and draw 50%; this gives a clear lay-up. From the resulting lie, aim 0.03 radians left of the automatic basket aim and draw 50% for a tested birdie approach. Straight ahead at 213/240 power is a precise ace fixture; aim 0.1 radians at 50% hits the gate trees. The course browser test uses actual mouse events to complete the flank route, restart, ace the gate and recover automatically from a tree hit. These fixtures validate reachable routes, not human difficulty or feel.


## Full nature round
Play all nine Sunny Pines holes in order. Check each basket updates the scorecard, Next hole starts at the new tee and the ninth basket shows the par-34 round total. R/Home must preserve earlier holes. Refresh after a landing and after completing the round to verify Resume. Test individual-hole practice from the menu. Throw into Willow Brook: one throw plus one penalty, immediate drop-zone lie; Space must reproduce it without doubling penalties. Compare the minimap water and rocks with the visible geometry. Automated coverage: node scripts/nature-browser.mjs; TEST_URL targets a deployed build.
