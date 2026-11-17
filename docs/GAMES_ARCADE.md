# The Games section ("the arcade")

Everything under `/play` is deliberately a different world from the rest of the app. It does not use the app's themes, fonts or colours.

## How it is switched on
* `src/arcade/ArcadeMode.tsx` is mounted by `App.tsx` whenever the path starts with `/play` (lazy: the CSS, fonts and effects are not loaded elsewhere). It sets `<html data-arcade>` and `<html data-game="verbum">` (the page after `/play/`).
* `src/styles/arcade.css` does all the visual work under those attributes: the palette (night-sky gradients, one colour set per game via `--bg1/--bg2/--bg3/--blob1/--blob2`), the fonts (Lilita One for display, Fredoka for text, both SIL OFL and bundled), chunky 3D buttons, colour-coded answer buttons, tile flips, the moving backdrop, each game's emblem beside its title, the underwater scene for Deep Waters, stage spotlights, the daily-dive banner and the player level.
* Effects (`src/arcade/fx.ts`): confetti, a ring under every tap, and synthesized sound blips (off until the player turns Sound on; the switch sits in the game's How to play row). A finished game is recognised when a result panel appears (`.ws-end`, `.dw-results`, `.tv-over`, `[data-win]`), which triggers confetti and a "Nice work" banner with an animated emoji.
* Everything respects reduced motion (`prefers-reduced-motion` and the app's own motion setting) and the sound is opt-in.

## Artwork
* 3D icons: Microsoft Fluent UI Emoji, 3D style (MIT), resized to 176 px WebP in `public/arcade/3d` (precached, about 0.7 MB).
* Animated emoji: Google Noto Emoji Animation (CC BY 4.0), 144 px, in `public/arcade/anim` (cached the first time they are shown).
* `src/arcade/art.tsx` maps each game to its icon (`GAME_ART`) and offers `<Art>` and `<Anim>`.
* Credits and licences: `docs/LICENSING.md`; the credit line is shown on the Games page.

## Adding or changing a game
* Give its page the usual markup; the shared classes (`.btn`, `.ws-opt`, `.q-tile`, `.vb-cell`, ...) are already styled. Add the game's colours and emblem to the lists at the end of `arcade.css` and `GAME_ART`.
* A result panel that should celebrate needs one of the finish classes or a `data-win` attribute.

## What is not claimed
This is mobile-casual-game polish built from CSS, bundled emoji art and a few animations. It is not hand-illustrated character art or a game engine.

## Deep Waters and Crown Quest have their own screens
* **Deep Waters** (`src/pages/play/DeepWatersPage.tsx`, `src/arcade/DiveScene.tsx`, `src/styles/deepwaters-pixel.css`) is a pixel ocean in the manner of the daily rare-answer game it follows: a title screen ("The daily dive", Begin descent), a canvas ocean that darkens with depth (sunlight, twilight, midnight, abyssal and hadal zones, 7,000 m floor, a Titanic silhouette at 3,800 m) with pixel creatures and marine snow, a submarine that follows the dive, a depth gauge down the left edge, an oxygen bar for the 25-second clock, pixel creatures for the six scoring tiers, a rank and depth on the results. Every point is 10 metres. The questions are not shown, and no clock runs, until Begin descent.
* **Crown Quest** (`src/pages/play/TriviaPage.tsx`, `src/styles/crownquest.css`) is in the manner of a spin-the-wheel quiz show: six categories, each with a colour and a 3D character; a glossy wheel with pegs and a ticking pointer; a board for each player with six character slots and a crown count; a question screen that fills the display with the category's colour, with the character inside a ring timer, a white question card and four large answer buttons; a crown-won banner. The characters, colours and names are the game's own.
* Neither is a copy of another game's art or code. They follow the structure and feel that public descriptions give (rounds, depth, a wheel, characters per category, crowns); the artwork is bundled emoji art and our own pixel drawing.
