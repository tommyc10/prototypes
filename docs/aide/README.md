# AIDE avatar concepts

Star Wars-inspired droid avatars for Imperial Ops, generated with the built-in image_gen tool.

| Avatar | Personality | Inspiration | Asset |
| --- | --- | --- | --- |
| Scout | Curious, compact, quietly helpful | ID9 seeker / probe droids | Removed |
| Protocol | Steady, watchful, a little dry | K-2SO | Removed |
| Co-pilot | Attentive, expressive, ready to help | BD-1 | Removed |
| Signal | Calm, attentive, listening | Original starship communications droid with over-ear headphones | [aide-signal-headphones-144.png](../../public/aide/avatars/aide-signal-headphones-144.png) |

Each original is a 1,254 × 1,254 RGBA PNG with a transparent background. Assets are available at `/aide/avatars/aide-<name>.png` when Vite serves the app.

Signal is the selected character, with headphones and a calm, attentive expression. Scout, Co-pilot and Protocol remain as earlier visual options.

The comparison shows 20px, 28px and 36px sizes and samples on the dashboard's dark and light surfaces. Present the artwork with `object-fit: contain` and `filter: grayscale(1)` for strict neutrality. Leave the transparent shape unmasked so the antennae remain visible.

The shared AideMark uses Signal in the sidebar dock (28px), chat header (36px) and floating button (28px). Its head follows the pointer slightly, nods once on a reply, and keeps a small check badge after the first shift is complete. Reduced motion disables the movement. Original renders are preserved.

The full final generation prompt for each avatar is recorded in [avatar-prompts.json](avatar-prompts.json).

Signal is a fresh standalone character with a visible graphite headband, silver earcups and charcoal cushions. Its final prompt is recorded separately in [signal-headphones-prompt.json](signal-headphones-prompt.json). The earlier comparison covers the original three options.

On 15 Nov 2026 the full-size renders were deleted so they no longer ship with the app. Only Signal remains, as a 144px copy (28 KB) shown at 28px and 36px. Scout, Protocol and Co-pilot were removed. Their prompts are still in avatar-prompts.json.
