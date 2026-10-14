# Player portraits

Current artwork comes from the user-supplied `questimate-avatars-256.zip`, independent of estimate-card illustrations.

- 16 individual WebP files: `public/avatars/characters-v2/avatar-01.webp` through `avatar-16.webp`.
- Each image is 256×256; combined file size is 415,666 bytes (406 KiB).
- Stable player portrait IDs: `portrait-01` through `portrait-16`.
- Circular crops display centered faces at 36–64 CSS pixels. No visible character names or rectangular nameplates.
- Observers do not reserve a portrait, take a seat, or cast a ballot; their names appear separately.
- The earlier generated atlas remains at `public/avatars/portraits-v1.webp` as a previous asset; the picker and seats use the individual portraits.

## Reusable individual portrait prompt

Create a square fantasy RPG avatar portrait of [character description]. Close-up face and upper shoulders, face large and centered, clearly visible eyes, whole head and hair inside a central circular safe area. Warm tavern candlelight, soft dark uncluttered background, detailed painterly realism, distinct readable silhouette at 48px. No full body, no card illustration, no frames, borders, circles, text, names, badges, or watermarks. Output a high quality square image; final delivery will be 256×256 WebP.

