# Demo asset placeholders

The Expo `app.json` references these assets:

- `icon.png`            (1024×1024 app icon)
- `splash.png`          (1284×2778 splash screen)
- `adaptive-icon.png`   (1024×1024 Android adaptive icon foreground)

Generate or replace these before running `expo prebuild` or submitting to the dApp Store.
The brand pass listed in `HALO.md` §15 (budget item: "Documentation site + branding + domain") will replace these with real assets.

For local `expo start` development, Expo will fall back to its default placeholders if the files are missing — so the app runs in an emulator without these populated.
