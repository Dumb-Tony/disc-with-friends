# Flight references and implementation decisions

Reviewed selected demonstration frames and available on-screen captions in the browser, not every minute of these videos. The overhand transcript was also readable; the other transcript panels stalled. No frame tracking or calibrated aerodynamic measurements were performed.

## Reference demonstrations

- Latitude 64, [4 crazy par-saving shots](https://www.youtube.com/watch?v=9POE6Yz8pnQ): tomahawk explanation around 3:40–4:10 and full-flight explanation around 5:45–6:07. The instructor demonstrates a changing disc orientation and a pan that comes back; release angle matters. The traced throw also illustrates that not every attempt completes the intended turn.
- Latitude 64, [How to throw a hyzer flip](https://www.youtube.com/watch?v=JsJ0otXNJRY): field demonstration around 3:17 and disc comparison around 3:37. The traced arc and explanation compare different disc stability at release. Release angle alone does not guarantee a particular flight. Our single-disc turn/fade remains speed dependent; this pass does not introduce a disc bag.
- Latitude 64 / Tomas Ekström, [Throw BETTER rollers](https://www.youtube.com/watch?v=DRy1wKji-HE): selected explanations around 3:11, 11:09 and 13:16–14:16 show rim orientation, placement and alternate upside-down releases. These inform treating rim-down rolling and top-down sliding as different contacts, rather than treating every large bank number as a roller.
- [USA Ultimate teaching manual](https://usaultimate.org/wp-content/uploads/2020/11/USAU_TeachingManual.pdf), hammer section: additional written reference for inverted flight, not a golf-disc calibration.

## Game interpretation

The input limit is still ±90 degrees. The airborne bank can continue beyond it. Overhand response blends in between 60 and 85 degrees of initial bank. Positive and negative releases produce mirrored arcade overhand behavior; we do not add grip or spin-direction controls.

Automatic spin and airspeed govern turnover rate: firm releases hold the initial orientation longer, weaker releases turn earlier. As bank passes upside down, lateral lift changes direction. Inverted lift is reduced, and gravity brings the disc down. This is a deterministic approximation, not a claim that maximum power makes all real overhands straight or that all real discs share this motion.

Top-down contacts slide and settle upside down. Shallow edge contacts can roll; steep edge/top contacts shed speed. Full flexible-body tumbling, wind gusts and per-disc aerodynamic measurements remain out of scope.

Tune the overhand blend angles, roll rates, spin reference and inverted lift in src/overhand.js. Ordinary flight remains in src/physics.js. Release direction, bank and power remain the only player inputs.
