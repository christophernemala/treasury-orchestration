# UI and product audit

## Findings by priority

1. **Critical — split experience:** the marketing shell and authenticated treasury app had separate visual systems. The operational workspace now owns the live state visualizer; it is no longer only decorative landing-page motion.
2. **High — disconnected animation:** the old Three.js background did not communicate treasury state and added a large rendering cost. It was removed from the mounted shell. `MotionRound` now represents SSE connection, reconciliation rate and exception count.
3. **High — truth boundary:** seeded runtime data cannot be described as bank-connected or production balances. The UI uses “illustrative” labels until the repository and identity adapters use reviewed evidence.
4. **Medium — operator control:** animation had no runtime controls. The new control surface provides play/pause, direction, looping, speed, rotation, scale, pulse, duration, delay, easing, pointer response, presets and theme.
5. **Medium — accessibility:** motion needed keyboard and reduced-motion behavior. The round supports Space and arrow keys, controls expose pressed state, a skip link was added, and reduced-motion keeps all workflows usable.

## Recommended direction

Keep the restrained white, navy and cool-gray finance system. Treat motion as a status and orientation layer, not entertainment. Prioritize persistence/auth migration, evidence ingestion and approval/audit integrity before adding more visual effects.

