# Mobile/PWA Master Audit v1.8.3

Baseline: v1.8.1. Visual source of truth: approved 1536x1024 Binso One Mobile App Design System board.

The v1.8.3 pass corrects remaining visual mismatches in palette, navigation, KPI surfaces, row density, controls, sheets, feedback, onboarding and dark-mode treatment. The exact-mockup contract is constrained to <=760 px so desktop is frozen.

## Splash lifecycle
The standalone mobile splash keeps once-per-session semantics while avoiding synchronous effect-driven state mutation. Animation-frame and timer cleanup are explicit.
