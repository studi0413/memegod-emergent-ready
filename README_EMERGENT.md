# MemeGod — Emergent Import Notes

This is the existing MemeGod website. Preserve the current visual identity and assets; improve it rather than rebuilding from scratch.

## Existing structure
- `index.html` — current complete website
- `assets/banner.webp` — X/banner-style hero image
- `assets/character.webp` — primary MemeGod character art
- `assets/king.webp` — king / wealth artwork
- `assets/car.webp` — cinematic supercar scene
- `assets/heli.webp` — helicopter/action scene
- `assets/moon.webp` — moon/rocket scene
- `assets/vault.webp` — vault/action scene
- `assets/money.webp` — money scene
- `assets/meme-god-theme.mp3` — MemeGod theme music

## Launch information
The `SITE` object in `index.html` currently contains:
- `contract`: `9rqq4ZxUu1MUK5DXZqtaNzTzobHZTAn4VEcEKSf4pump`
- `pumpfun`: `https://pump.fun/coin/9rqq4ZxUu1MUK5DXZqtaNzTzobHZTAn4VEcEKSf4pump`
- `x`: `https://x.com/memegodcoinz`
- `ticker`: `$MEMEGOD`

## First Emergent instruction
Use the prompt below after pulling this repository into Emergent:

---

You are continuing an EXISTING MemeGod website. Do not replace it with a generic crypto template and do not redesign the character.

First inspect the entire repository, especially `index.html` and every file in `/assets`. Treat the existing site as the design source of truth.

GOAL:
Polish this into a premium cinematic meme-coin website for MemeGod while preserving the current dark action-movie identity, character artwork, banner, music, layout direction, and existing functionality.

DESIGN DIRECTION:
- Almost-black / deep navy background throughout.
- Cinematic lighting, subtle blue glow, restrained gold accents, smoke/energy atmosphere.
- It should feel like a premium action-movie/game landing page, NOT a cartoon coloring-book crypto template.
- Keep the existing MemeGod artwork prominent and sharp.
- Do not generate replacement mascot art unless I specifically ask later.
- Avoid excessive gradients, cheesy crypto icons, generic Web3 cards, or clutter.
- Desktop should feel dramatic and wide; mobile must remain clean and fast.

HERO:
- Keep `assets/banner.webp` as the main hero/background artwork.
- Preserve the dark empty space on the left for the headline and CTA.
- Headline should emphasize: “MEMEGOD” and “THE GOD OF MEME COINS”.
- Keep the copy direct and human, not corporate or AI-sounding.
- Primary CTA: Buy on Pump.fun.
- Secondary CTA: X.
- Show the contract address with a one-click Copy button once supplied.

ART / CONTENT:
- Use `assets/character.webp` as the core character showcase.
- Use `assets/king.webp` for a wealth/king section.
- Keep the cinematic gallery using car, helicopter, moon, vault, and money artwork.
- Make image transitions subtle and premium: reveal, parallax, slow zoom, light sweep. No excessive bouncing.

MUSIC:
- Keep `assets/meme-god-theme.mp3` as the theme music.
- Attempt autoplay on page load, but browsers may block audio. If blocked, start music on the visitor's first interaction.
- Keep a visible, elegant mute/unmute control.
- Do not make the music control intrusive.

FUNCTIONAL REQUIREMENTS:
- Preserve all existing external-link behavior.
- Preserve contract copy functionality.
- Keep placeholders for the Pump.fun URL, contract address, and ticker until I provide the final values.
- Do not invent a contract address, token price, market cap, holder count, liquidity, audit status, locked-liquidity claim, or any other financial/statistical claim.
- Do not add fake live data.
- Make all buttons keyboard accessible and mobile friendly.
- Optimize images/audio loading without deleting or visibly degrading the artwork.
- Add proper Open Graph/Twitter metadata using the banner image so shared links look good.
- Add favicon/site icon based on the main MemeGod artwork if possible using existing assets.
- Keep the site static unless a backend is truly needed. Do not add login, database, payments, or unnecessary frameworks.

SEO / META:
Title: MemeGod — The God of Meme Coins
Description: MemeGod isn’t another meme coin. It’s the revolution we’ve been waiting for. There are meme coins… and then there’s MemeGod.

IMPORTANT WORKFLOW:
1. Inspect the existing site first.
2. Tell me briefly what you intend to change.
3. Make incremental improvements rather than rebuilding everything.
4. Preview and test desktop + mobile.
5. Check all local image and audio paths.
6. Do not change the external-link placeholders until I give you the real values.

When finished, summarize exactly what you changed and identify any remaining placeholders I still need to provide.

---

## Recommended workflow
1. Import/pull this repo into Emergent.
2. Paste the first instruction above.
3. Preview before approving major visual changes.
4. Save stable versions to GitHub before large changes.
