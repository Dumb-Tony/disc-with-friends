# Mechanics playtest

This build is ready for feedback, not a declaration that the mechanics feel excellent. Automated browser interaction verifies input and state transitions; visual inspection verifies framing. Neither replaces a person's mouse feel or comfort judgement.

## Quick session

1. Make a small, medium and full flat draw. Do their distances feel connected to your hand? Back the mouse forward before release to reduce power.
2. Repeat at left and right bank angles. Find flat again. Does the neutral snap help without trapping you?
3. During a draw, move sideways deliberately. Direction must stay locked.
4. Try R immediately after launch; throw again. Try Esc/RMB cancellation without an accidental throw.
5. Watch the flight and landing. Can you keep the disc in view and understand where it stopped? Any uncomfortable camera swing?
6. Press Space: identical replay. N continues from the lie. Home returns to the tee.
7. Reach the basket from your lie. Check gentle catches and hard rejections. Try a deliberately steep bank for a roller.
8. Open T, change one coefficient, make a new throw, then restore defaults. Check sidewind/headwind/tailwind.

Report what you expected, what happened, and whether the issue was input, flight, camera or landing. Export shot + tuning for a reproducible physics report. Useful priorities: draw distance sensitivity, low-power precision, visible late fade, anhyzer flex, landing friction, camera speed.

## Automated validation

`npm test`: deterministic sampled states; draw direction and angle lock; reversible power; neutral snap; cancellation; useful distance/angle separation; ground bounds and finite settlement over power/bank/wind combinations; edge rolling; swept basket catch/rejection/miss; 30/60/144 Hz render grouping equivalence.

`node scripts/browser-test.mjs`: Chrome pointer draw/angle gesture, launch, completed landing, identical replay, next lie, tee reset, tuning persistence and page error collection. Captures welcome, flight, landing and setup screenshots locally. This is automated input playback, not manual human playtesting.
